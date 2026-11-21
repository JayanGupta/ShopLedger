const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const app = require('../server');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');
const store = require('../lib/store');

test('a printed invoice uses the billed HSN rate, GST, and total for an order without a coupon', () => {
  const order = {
    id: 1001,
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }],
    subtotal: 100,
    discount: 0,
    tax: 5,
    total: 105
  };

  const { tax, total, rows } = invoice.computeInvoiceFigures(order);
  const [{ gstPercent, lineTax }] = rows;
  assert.deepEqual({ tax, total, gstPercent, lineTax }, {
    tax: 5, total: 105, gstPercent: 5, lineTax: 5
  });
});

test('the mixed-HSN invoice matches checkout, the Khata debit, and the reconciliation report', async (t) => {
  const db = {
    products: [
      { id: 1, name: 'Rice', hsn: '1006', price: 500, stock: 10 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 1000, stock: 10 }
    ],
    customers: [{ id: 1, name: 'Test Customer', creditLimit: 5000 }],
    orders: [],
    nextOrderId: 1001
  };
  t.mock.method(store, 'read', () => db);
  t.mock.method(store, 'write', (updated) => assert.strictEqual(updated, db));

  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const checkout = {
    items: [{ id: 1, qty: 2 }, { id: 2, qty: 1 }],
    coupon: ' save10 ',
    customerId: 1,
    paymentMode: 'khata'
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkout)
  };

  const previewResponse = await fetch(`${baseUrl}/api/pricing/preview`, options);
  assert.equal(previewResponse.status, 200);
  const { totals } = await previewResponse.json();
  assert.deepEqual(totals, {
    subtotal: 2000, discount: 150, taxable: 1850, tax: 157.25,
    cgst: 78.63, sgst: 78.62, total: 2007.25,
    lines: [
      { id: 1, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 1000, discount: 75, taxable: 925, tax: 46.25, net: 971.25 },
      { id: 2, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 1000, discount: 75, taxable: 925, tax: 111, net: 1036 }
    ]
  });

  const orderResponse = await fetch(`${baseUrl}/api/orders`, options);
  assert.equal(orderResponse.status, 201);
  const order = await orderResponse.json();
  assert.equal(order.coupon, 'SAVE10');
  assert.equal(order.subtotal, 2000);
  assert.equal(order.discount, 150);
  assert.equal(order.tax, 157.25);
  assert.equal(order.total, 2007.25);
  assert.equal(db.customers[0].totalBilled, 2007.25);

  const { rows, ...figures } = invoice.computeInvoiceFigures(order);
  assert.deepEqual(figures, {
    subtotal: 2000, discount: 150, tax: 157.25, cgst: 78.63, sgst: 78.62, total: 2007.25
  });
  assert.deepEqual(rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })), [
    { hsn: '1006', gstPercent: 5, lineTax: 46.25 },
    { hsn: '0405', gstPercent: 12, lineTax: 111 }
  ]);

  const invoiceResponse = await fetch(`${baseUrl}/orders/${order.id}/invoice`);
  assert.equal(invoiceResponse.status, 200);
  const html = await invoiceResponse.text();
  assert.match(html, /<td>1006<\/td><td class="r">2<\/td><td class="r">₹500\.00<\/td><td class="r">5%<\/td><td class="r">₹46\.25/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹157\.25/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2007\.25/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const reportResponse = await fetch(`${baseUrl}/api/reports/gst-reconciliation`);
  assert.equal(reportResponse.status, 200);
  assert.deepEqual(await reportResponse.json(), {
    totalChecked: 1,
    mismatchCount: 0,
    totalDelta: 0,
    rows: [{
      orderId: order.id, date: order.date, customer: 'Test Customer', coupon: 'SAVE10',
      ledgerSubtotal: 2000, ledgerDiscount: 150, ledgerTax: 157.25, ledgerTotal: 2007.25,
      invoiceDiscount: 150, invoiceTax: 157.25, invoiceTotal: 2007.25, delta: 0, matched: true
    }]
  });
});

test('a percentage coupon reduces the taxable amount for both checkout and the invoice', () => {
  const items = [{ name: 'Tea', hsn: '0902', price: 500, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const order = { id: 1001, items, coupon: 'SAVE10', ...billed };
  const printed = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 50);
  assert.equal(billed.tax, 81);
  assert.equal(billed.total, 531);
  assert.equal(printed.discount, 50);
  assert.equal(printed.tax, 81);
  assert.equal(printed.total, 531);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('reconciliation still flags a stored GST difference when totals agree and skips cancelled orders', () => {
  const order = {
    id: 1001,
    items: [{ name: 'Tea', hsn: '0902', price: 500, qty: 1 }],
    coupon: 'SAVE10', subtotal: 500, discount: 59, tax: 90, total: 531
  };
  const cancelled = { ...order, id: 1002, status: 'cancelled' };
  const report = reports.getGstReconciliation({ orders: [order, cancelled] });
  assert.equal(report.totalChecked, 1);
  assert.equal(report.mismatchCount, 1);
  assert.equal(report.totalDelta, 0);
  assert.equal(report.rows[0].orderId, 1001);
  assert.equal(report.rows[0].ledgerTax, 90);
  assert.equal(report.rows[0].invoiceTax, 81);
  assert.equal(report.rows[0].delta, 0);
  assert.equal(report.rows[0].matched, false);
});

test('a flat coupon reduces the taxable amount for both checkout and the invoice', () => {
  const items = [{ name: 'Tea', hsn: '0902', price: 400, qty: 1 }];
  const billed = pricing.computeTotals(items, 'FLAT50');
  const printed = invoice.computeInvoiceFigures({ items, coupon: 'FLAT50' });

  assert.equal(billed.discount, 50);
  assert.equal(billed.taxable, 350);
  assert.equal(billed.tax, 63);
  assert.equal(billed.total, 413);
  assert.equal(printed.discount, 50);
  assert.equal(printed.tax, 63);
  assert.equal(printed.total, 413);
});

test('the invoice uses the checkout interpretation of explicit percentage, fractional, and zero GST rates', () => {
  const items = [
    { name: 'Percentage rate', price: 100, qty: 1, gstRate: 12 },
    { name: 'Fractional rate', price: 100, qty: 1, gstRate: 0.12 },
    { name: 'Zero rate', price: 100, qty: 1, gstRate: 0 }
  ];
  const billed = pricing.computeTotals(items);
  const printed = invoice.computeInvoiceFigures({ items });

  assert.deepEqual(billed.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [[12, 12], [12, 12], [0, 0]]);
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [[12, 12], [12, 12], [0, 0]]);
});

test('the invoice sums rounded line GST and splits the sum the same way as checkout', () => {
  const items = [
    { name: 'Tea sample', price: 0.03, qty: 1 },
    { name: 'Coffee sample', price: 0.03, qty: 1 }
  ];
  const billed = pricing.computeTotals(items);
  const order = { id: 1001, items, ...billed };
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(billed.lines.map((line) => line.tax), [0.01, 0.01]);
  assert.equal(billed.tax, 0.02);
  assert.equal(billed.cgst, 0.01);
  assert.equal(billed.sgst, 0.01);
  assert.equal(billed.total, 0.08);
  assert.deepEqual(rows.map((row) => row.lineTax), [0.01, 0.01]);
  assert.deepEqual(figures, {
    subtotal: 0.06, discount: 0, tax: 0.02, cgst: 0.01, sgst: 0.01, total: 0.08
  });
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('an undiscounted default-rate order reconciles without an invoice notice', () => {
  const items = [{ name: 'Unclassified item', price: 100, qty: 1 }];
  const order = { id: 1001, items, ...pricing.computeTotals(items) };
  const printed = invoice.computeInvoiceFigures(order);
  const report = reports.getGstReconciliation({ orders: [order] });

  assert.equal(order.tax, 18);
  assert.equal(order.total, 118);
  assert.equal(printed.tax, 18);
  assert.equal(printed.total, 118);
  assert.equal(report.mismatchCount, 0);
  assert.equal(report.rows[0].matched, true);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
