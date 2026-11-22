const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

function billedOrder(items, coupon = '') {
  // Keep the same totals and line shape that checkout passes to the order store.
  const { subtotal, discount, tax, total } = pricing.computeTotals(items, coupon);
  return { id: 1, date: '01/02/2021', status: 'completed', items, coupon, subtotal, discount, tax, total };
}

function mixedSlabItems() {
  return [
    { id: 1, sku: 'RICE', name: 'Rice', hsn: '1006', price: 500, qty: 2 },
    { id: 2, sku: 'GHEE', name: 'Ghee', hsn: '0405', price: 1000, qty: 1 }
  ];
}

test('checkout caps SAVE10 and charges HSN GST on discounted lines', () => {
  const { subtotal, discount, tax, cgst, sgst, total, lines } =
    pricing.computeTotals(mixedSlabItems(), 'SAVE10');

  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, {
    subtotal: 2000, discount: 150, tax: 157.25, cgst: 78.63, sgst: 78.62, total: 2007.25
  });
  assert.deepEqual(lines.map(({ gstPercent, discount, taxable, tax }) =>
    ({ gstPercent, discount, taxable, tax })), [
    { gstPercent: 5, discount: 75, taxable: 925, tax: 46.25 },
    { gstPercent: 12, discount: 75, taxable: 925, tax: 111 }
  ]);
});

test('invoice HTML displays billed GST and total without a variance notice', () => {
  const html = invoice.render(billedOrder(mixedSlabItems(), 'SAVE10'));

  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">[^\d]157\.25/);
  assert.match(html, /Invoice Total<\/td><td class="r">[^\d]2007\.25/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('invoice preserves an explicit zero GST rate', () => {
  const order = billedOrder([{ name: 'Legacy item', price: 100, qty: 1, gstRate: 0 }]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.tax, 0);
  assert.equal(order.total, 100);
  assert.equal(figures.rows[0].gstPercent, 0);
  assert.equal(figures.tax, 0);
  assert.equal(figures.total, 100);
});

test('reconciliation reports the total variance and flags a GST-only mismatch', () => {
  const order = billedOrder(mixedSlabItems(), 'SAVE10');
  const staleTotal = { ...order, total: 2124 };
  const gstOnlyMismatch = { ...order, id: 2, tax: 360 };
  const matchingOrder = {
    ...billedOrder([{ name: 'Unclassified item', price: 100, qty: 1 }]),
    id: 3
  };
  const result = reports.getGstReconciliation({ orders: [staleTotal, gstOnlyMismatch, matchingOrder, order] });

  assert.equal(result.totalChecked, 4);
  assert.equal(result.mismatchCount, 2);
  assert.equal(result.totalDelta, 116.75);
  assert.deepEqual(result.rows.map(({ ledgerTax, invoiceTax, delta, matched }) =>
    ({ ledgerTax, invoiceTax, delta, matched })), [
    { ledgerTax: 157.25, invoiceTax: 157.25, delta: -116.75, matched: false },
    { ledgerTax: 360, invoiceTax: 157.25, delta: 0, matched: false },
    { ledgerTax: 18, invoiceTax: 18, delta: 0, matched: true },
    { ledgerTax: 157.25, invoiceTax: 157.25, delta: 0, matched: true }
  ]);
});

test('invoice figures match the billed total and discounted GST breakdown', () => {
  const order = billedOrder(mixedSlabItems(), 'SAVE10');
  const { discount, tax, cgst, sgst, total, rows } = invoice.computeInvoiceFigures(order);

  assert.deepEqual({ discount, tax, cgst, sgst, total }, {
    discount: order.discount, tax: order.tax, cgst: 78.63, sgst: 78.62, total: order.total
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 46.25],
    [12, 111]
  ]);
});
