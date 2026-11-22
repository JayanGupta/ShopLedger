'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Independent, hand-calculated expectations. All fixtures are in memory.
// Existing invoice fixes predate this suite; this is not a tests-first history.
function item(id, hsn, price, qty, extra) {
  return Object.assign({ id, sku: 'TEST-' + id, name: 'Test item ' + id, hsn, price, qty }, extra);
}

function verify(items, coupon, expected, rates, lineTaxes) {
  const before = JSON.stringify(items);
  const actual = invoice.computeInvoiceFigures({ items, coupon });
  const checkout = pricing.computeTotals(items, coupon);
  for (const key of ['subtotal', 'discount', 'tax', 'total']) {
    assert.equal(actual[key], expected[key], 'invoice ' + key);
    assert.equal(checkout[key], expected[key], 'checkout ' + key);
  }
  assert.equal(actual.cgst, checkout.cgst);
  assert.equal(actual.sgst, checkout.sgst);
  assert.equal(Math.round((actual.cgst + actual.sgst) * 100), Math.round(actual.tax * 100));
  assert.deepEqual(actual.rows.map(row => row.gstPercent), rates);
  assert.deepEqual(actual.rows.map(row => row.lineTax), lineTaxes);
  assert.equal(JSON.stringify(items), before, 'calculation must not mutate item snapshots');
  return actual;
}

const cases = [
  { name: '#1001 actual mix: 18% tea and 5% dal, no coupon',
    items: [item(8, '0902', 140, 2), item(2, '0713', 165, 2)], coupon: '',
    expected: { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }, rates: [18, 5], taxes: [50.4, 16.5] },
  { name: 'workshop mixed 5% / 12% case, no coupon',
    items: [item(1, '1006', 640, 1), item(6, '0405', 450, 1)], coupon: '',
    expected: { subtotal: 1090, discount: 0, tax: 86, total: 1176 }, rates: [5, 12], taxes: [32, 54] },
  { name: '#1002 SAVE10 discounts the taxable value before 5% GST',
    items: [item(1, '1006', 640, 1), item(4, '1512', 190, 2)], coupon: 'SAVE10',
    expected: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }, rates: [5, 5], taxes: [28.8, 17.1] },
  { name: '#1004 SAVE10 is capped at Rs150 on Rs2240',
    items: [item(5, '1508', 1120, 2)], coupon: 'SAVE10',
    expected: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }, rates: [5], taxes: [104.5] },
  { name: '#1008 all 18%, no coupon: unchanged control case',
    items: [item(8, '0902', 140, 1), item(12, '2106', 180, 2)], coupon: '',
    expected: { subtotal: 500, discount: 0, tax: 90, total: 590 }, rates: [18, 18], taxes: [25.2, 64.8] },
  { name: 'FLAT50 is allocated proportionally across 12% / 18% items',
    items: [item(7, '0405', 260, 1), item(8, '0902', 140, 1)], coupon: 'FLAT50',
    expected: { subtotal: 400, discount: 50, tax: 49.35, total: 399.35 }, rates: [12, 18], taxes: [27.3, 22.05] },
  { name: 'trimmed lowercase coupon uses checkout normalization',
    items: [item(1, '1006', 1000, 1)], coupon: ' save10 ',
    expected: { subtotal: 1000, discount: 100, tax: 45, total: 945 }, rates: [5], taxes: [45] },
  { name: 'below SAVE10 minimum gives no discount in the figures helper',
    items: [item(1, '1006', 499, 1)], coupon: 'SAVE10',
    expected: { subtotal: 499, discount: 0, tax: 24.95, total: 523.95 }, rates: [5], taxes: [24.95] },
  { name: 'SAVE10 minimum is inclusive at Rs500',
    items: [item(1, '1006', 500, 1)], coupon: 'SAVE10',
    expected: { subtotal: 500, discount: 50, tax: 22.5, total: 472.5 }, rates: [5], taxes: [22.5] },
  { name: 'inactive DIWALI20 gives no discount in the figures helper',
    items: [item(8, '0902', 1000, 1)], coupon: 'DIWALI20',
    expected: { subtotal: 1000, discount: 0, tax: 180, total: 1180 }, rates: [18], taxes: [180] },
  { name: 'unknown HSN falls back to 18%',
    items: [item(1, 'UNKNOWN', 100, 1)], coupon: '',
    expected: { subtotal: 100, discount: 0, tax: 18, total: 118 }, rates: [18], taxes: [18] },
  { name: 'odd-paisa GST preserves CGST plus SGST exactly',
    items: [item(1, '0902', 0.05, 1)], coupon: '',
    expected: { subtotal: 0.05, discount: 0, tax: 0.01, total: 0.06 }, rates: [18], taxes: [0.01] }
];

for (const scenario of cases) {
  test('CURRENT BEHAVIOUR: ' + scenario.name, () => {
    verify(scenario.items, scenario.coupon, scenario.expected, scenario.rates, scenario.taxes);
  });
}

for (const gstRate of [12, 0.12, 0]) {
  test('explicit gstRate ' + gstRate + ' overrides the 5% HSN mapping', () => {
    const tax = gstRate === 0 ? 0 : 12;
    verify([item(1, '1006', 100, 1, { gstRate })], '',
      { subtotal: 100, discount: 0, tax, total: 100 + tax }, [tax], [tax]);
  });
}

test('empty invoice has zero figures and no rows', () => {
  verify([], '', { subtotal: 0, discount: 0, tax: 0, total: 0 }, [], []);
  assert.deepEqual(invoice.computeInvoiceFigures({}).rows, []);
});

test('REGRESSION: capped SAVE10 across 5% and 12% slabs matches the billed figures', () => {
  // Rs150 cap: line discounts are Rs124.91 and Rs25.09.
  // Post-discount GST: Rs105.75 + Rs50.99 = Rs156.74.
  verify([item(5, '1508', 1120, 2), item(6, '0405', 450, 1)], 'SAVE10',
    { subtotal: 2690, discount: 150, tax: 156.74, total: 2696.74 },
    [5, 12], [105.75, 50.99]);
});

function printableOrder(total) {
  return { id: 42, date: '22/11/2026', customer: '<script>customer</script>',
    paymentMode: 'cash', status: 'completed', coupon: '', total,
    items: [item(1, '1006', 100, 1, { name: '<script>product</script>' })] };
}

test('printable HTML shows the billed total and escapes customer and product text', () => {
  const html = invoice.render(printableOrder(105));
  assert.ok(html.includes('105.00'));
  assert.ok(html.includes('&lt;script&gt;customer&lt;/script&gt;'));
  assert.ok(html.includes('&lt;script&gt;product&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('Accountant Reconciliation Notice:'));
});

test('printable HTML flags a one-paisa difference from the recorded total', () => {
  const html = invoice.render(printableOrder(104.99));
  assert.ok(html.includes('Accountant Reconciliation Notice:'));
  assert.ok(html.includes('0.01'));
});
