const test = require('node:test');
const assert = require('node:assert').strict;
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function computeFigures(items, coupon = '') {
  const checkout = pricing.computeTotals(items, coupon);
  const order = {
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };
  return { checkout, printed: invoice.computeInvoiceFigures(order) };
}

function summarize(figures, lines, taxField) {
  const { subtotal, discount, tax, cgst, sgst, total } = figures;
  return {
    subtotal,
    discount,
    tax,
    cgst,
    sgst,
    total,
    lineGst: lines.map(line => [line.gstPercent, line[taxField]])
  };
}

test('#1001 model matches mixed HSN GST with and without a flat discount', () => {
  const items = [
    { id: 1, name: 'Synthetic pulses', price: 165, qty: 2, hsn: '0713' },
    { id: 2, name: 'Synthetic ghee', price: 140, qty: 2, hsn: '0405' }
  ];
  const { checkout, printed } = computeFigures(items);

  const expected = {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10,
    lineGst: [[5, 16.50], [12, 33.60]]
  };
  assert.deepEqual(summarize(checkout, checkout.lines, 'tax'), expected);
  assert.deepEqual(summarize(printed, printed.rows, 'lineTax'), expected);

  const flat = computeFigures(items, 'FLAT50');
  const expectedFlat = {
    subtotal: 610, discount: 50, tax: 46, cgst: 23, sgst: 23, total: 606,
    lineGst: [[5, 15.15], [12, 30.85]]
  };
  assert.deepEqual(summarize(flat.checkout, flat.checkout.lines, 'tax'), expectedFlat);
  assert.deepEqual(summarize(flat.printed, flat.printed.rows, 'lineTax'), expectedFlat);
});

test('#1002 printable invoice shows the SAVE10 checkout total and GST', () => {
  const items = [
    { id: 3, name: 'Synthetic rice', price: 640, qty: 1, hsn: '1006' },
    { id: 4, name: 'Synthetic sunflower oil', price: 190, qty: 2, hsn: '1512' }
  ];
  const { checkout, printed } = computeFigures(items, 'SAVE10');

  const expected = {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    lineGst: [[5, 28.80], [5, 17.10]]
  };
  assert.deepEqual(summarize(checkout, checkout.lines, 'tax'), expected);
  assert.deepEqual(summarize(printed, printed.rows, 'lineTax'), expected);

  const html = invoice.render({ id: 1002, items, coupon: 'SAVE10', total: checkout.total });
  assert.match(html, /Invoice Total<\/td><td class="r">₹963\.90<\/td>/);
  assert.match(html, /Total GST\)<\/td><td class="r">₹45\.90<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('#1004 model applies the SAVE10 discount cap before invoice GST', () => {
  const items = [
    { id: 5, name: 'Synthetic groundnut oil', price: 1120, qty: 2, hsn: '1508' }
  ];
  const { checkout, printed } = computeFigures(items, 'SAVE10');

  const expected = {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
    lineGst: [[5, 104.50]]
  };
  assert.deepEqual(summarize(checkout, checkout.lines, 'tax'), expected);
  assert.deepEqual(summarize(printed, printed.rows, 'lineTax'), expected);
});

test('#1008 model matches checkout for 18% GST without a coupon', () => {
  const items = [
    { id: 6, name: 'Synthetic tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
    { id: 7, name: 'Synthetic syrup', price: 180, qty: 2, hsn: '2106' }
  ];
  const { checkout, printed } = computeFigures(items);
  const expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lineGst: [[18, 25.20], [18, 64.80]]
  };

  assert.deepEqual(summarize(checkout, checkout.lines, 'tax'), expected);
  assert.deepEqual(summarize(printed, printed.rows, 'lineTax'), expected);
});

test('#1002 invoice matches checkout for SAVE10 and 5% HSN GST after discount', () => {
  const items = [
    { id: 3, name: 'Synthetic rice', price: 640, qty: 1, hsn: '1006' },
    { id: 4, name: 'Synthetic sunflower oil', price: 190, qty: 2, hsn: '1512' }
  ];
  const { checkout, printed } = computeFigures(items, 'SAVE10');
  const expected = {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    lineGst: [[5, 28.80], [5, 17.10]]
  };

  assert.deepEqual(checkout.lines.map(({ hsn, discount, taxable }) => ({ hsn, discount, taxable })), [
    { hsn: '1006', discount: 64, taxable: 576 },
    { hsn: '1512', discount: 38, taxable: 342 }
  ]);
  assert.deepEqual(summarize(checkout, checkout.lines, 'tax'), expected);
  assert.deepEqual(printed.rows.map(row => row.hsn), ['1006', '1512']);
  assert.deepEqual(summarize(printed, printed.rows, 'lineTax'), expected);
});

test('historical invoice preserves billed amounts after its coupon is deactivated', () => {
  const config = require('../config');
  const items = [{ name: 'Synthetic tea', hsn: '0902', price: 1000, qty: 1 }];
  const coupon = 'SAVE10';
  const { subtotal, discount, tax, total } = pricing.computeTotals(items, coupon);
  const order = { id: 2001, items, coupon, subtotal, discount, tax, total };
  const wasActive = config.coupons.SAVE10.active;

  try {
    config.coupons.SAVE10.active = false;
    const html = invoice.render(order);
    const totalsRows = /<tr(?: class="grand")?><td>(Gross Subtotal|CGST \+ SGST \(Total GST\)|Coupon Discount \(SAVE10\)|Invoice Total)<\/td><td[^>]*>(-?₹[\d.]+)<\/td><\/tr>/g;
    const displayed = Object.fromEntries(Array.from(html.matchAll(totalsRows), ([, label, amount]) => [label, amount]));

    assert.deepEqual(displayed, {
      'Gross Subtotal': '₹1000.00',
      'CGST + SGST (Total GST)': '₹162.00',
      'Coupon Discount (SAVE10)': '-₹100.00',
      'Invoice Total': '₹1062.00'
    });
    assert.match(html, /Accountant Reconciliation Notice/);
    assert.match(html, /Historical per-line GST and discount allocations could not be verified/);
    assert.match(html, /<td class="r">&mdash;<\/td><td class="r">&mdash;<\/td>/);
    assert.equal(invoice.computeInvoiceFigures(order).total, 1180);
  } finally {
    config.coupons.SAVE10.active = wasActive;
  }
});
