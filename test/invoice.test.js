const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(hsn, price, qty) {
  return { name: 'Fixture ' + hsn, sku: hsn, hsn, price, qty };
}

const cases = [
  [1001, [item('0902', 140, 2), item('0713', 165, 2)], '', 676.90],
  [1002, [item('1006', 640, 1), item('1512', 190, 2)], 'SAVE10', 963.90],
  [1004, [item('1508', 1120, 2)], 'SAVE10', 2194.50],
  [1008, [item('0902', 140, 1), item('2106', 180, 2)], '', 590]
];

for (const [id, items, coupon, billed] of cases) {
  test('Matching invoice #' + id, () => {
    assert.equal(pricing.computeTotals(items, coupon).total, billed);
    assert.equal(invoice.computeInvoiceFigures({ items, coupon }).total, billed);
  });
}

test('discounted invoice shows the checkout GST slab and split for each line', () => {
  const items = [item('1006', 640, 1), item('1512', 190, 2)];
  const figures = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });
  assert.deepEqual(figures.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 28.8], [5, 17.1]]);
  assert.deepEqual([figures.subtotal, figures.discount, figures.tax, figures.cgst, figures.sgst, figures.total],
    [1020, 102, 45.90, 22.95, 22.95, 963.90]);
});
