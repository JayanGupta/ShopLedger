const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

// Use the line shape and saved totals written by the order route.
function billedOrder(items, coupon = '') {
  const { subtotal, discount, tax, total } = pricing.computeTotals(items, coupon);
  return {
    id: 1001,
    date: '28/11/2026',
    customer: 'Walk-in',
    status: 'completed',
    items,
    coupon,
    subtotal,
    discount,
    tax,
    total
  };
}

function discountedOrder() {
  return billedOrder([
    { id: 1, name: 'Rice', hsn: '1006', price: 600, qty: 2 },
    { id: 2, name: 'Ghee', hsn: '0405', price: 800, qty: 1 }
  ], 'SAVE10');
}

test('invoice and checkout agree for an undiscounted 18% line', () => {
  const order = billedOrder([{ name: 'Tea', hsn: '0902', price: 100, qty: 2 }]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.total, 236);
  assert.equal(figures.total, 236);
  assert.equal(figures.tax, 36);
  assert.equal(figures.cgst, 18);
  assert.equal(figures.sgst, 18);
  assert.equal(figures.rows[0].gstPercent, 18);
  assert.equal(figures.rows[0].lineTax, 36);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('invoice matches billed totals and the discounted GST breakdown for mixed HSN rates', () => {
  const order = discountedOrder();
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.subtotal, 2000);
  assert.equal(order.discount, 150);
  assert.equal(order.tax, 144.30);
  assert.equal(order.total, 1994.30);
  assert.equal(figures.total, order.total);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.cgst, 72.15);
  assert.equal(figures.sgst, 72.15);
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 55.50],
    [12, 88.80]
  ]);
});

test('invoice applies a stored explicit GST rate after the flat discount', () => {
  const order = billedOrder([
    { name: 'Rice', hsn: '1006', gstRate: 5, price: 500, qty: 1 }
  ], 'FLAT50');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.discount, 50);
  assert.equal(order.tax, 22.50);
  assert.equal(order.total, 472.50);
  assert.equal(figures.discount, 50);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 22.50);
  assert.equal(figures.tax, 22.50);
  assert.equal(figures.cgst, 11.25);
  assert.equal(figures.sgst, 11.25);
  assert.equal(figures.total, 472.50);
});

test('invoice GST sums the same rounded line taxes as checkout', () => {
  const order = billedOrder([
    { name: 'Rice', gstRate: 5, price: 0.10, qty: 1 },
    { name: 'Dal', gstRate: 5, price: 0.10, qty: 1 }
  ]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures.rows.map(row => row.lineTax), [0.01, 0.01]);
  assert.equal(order.tax, 0.02);
  assert.equal(order.total, 0.22);
  assert.equal(figures.tax, 0.02);
  assert.equal(figures.cgst, 0.01);
  assert.equal(figures.sgst, 0.01);
  assert.equal(figures.total, 0.22);
});

test('printable invoice shows the billed GST and total without a warning', () => {
  const html = invoice.render(discountedOrder());

  assert.match(html, />Taxable Value<\/th>/);
  assert.match(html, />5%<\/td><td class="r">₹1110\.00<\/td><td class="r">₹55\.50<\/td>/);
  assert.match(html, />12%<\/td><td class="r">₹740\.00<\/td><td class="r">₹88\.80<\/td>/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹144\.30/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹1994\.30/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('reconciliation reports a match for the mixed-rate billed order', () => {
  const summary = reports.getGstReconciliation({ orders: [discountedOrder()] });

  assert.equal(summary.totalChecked, 1);
  assert.equal(summary.mismatchCount, 0);
  assert.equal(summary.totalDelta, 0);
  assert.deepEqual(summary.rows[0], {
    orderId: 1001,
    date: '28/11/2026',
    customer: 'Walk-in',
    coupon: 'SAVE10',
    ledgerSubtotal: 2000,
    ledgerDiscount: 150,
    ledgerTax: 144.30,
    ledgerTotal: 1994.30,
    invoiceDiscount: 150,
    invoiceTax: 144.30,
    invoiceTotal: 1994.30,
    delta: 0,
    matched: true
  });
});

test('printable invoice explains checkout rounding when line taxable values differ from the billed taxable subtotal', () => {
  const order = billedOrder([
    { name: 'Rice', hsn: '1006', price: 0.10, qty: 1 },
    { name: 'Dal', hsn: '0713', price: 0.10, qty: 1 }
  ], 'WELCOME');
  const html = invoice.render(order);

  assert.equal(order.total, 0.19);
  assert.match(html, /rounding adjustment of \+₹0\.01 to the sum of line taxable values/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹0\.19/);
});

test('an order with a different saved total still shows a reconciliation warning', () => {
  const order = { ...discountedOrder(), total: 2000 };
  const html = invoice.render(order);
  const summary = reports.getGstReconciliation({ orders: [order] });

  assert.match(html, /Accountant Reconciliation Notice/);
  assert.match(html, /recorded total \(₹2000\.00\) by -₹5\.70/);
  assert.equal(summary.mismatchCount, 1);
  assert.equal(summary.rows[0].delta, -5.70);
});
