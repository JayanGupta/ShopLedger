'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Hand-built fixtures; tests never load the application's persisted database.
const cases = [
  { id: 1001, coupon: '', items: [
    { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 140, qty: 2 },
    { id: 2, sku: 'GRN-002', name: 'Dal', hsn: '0713', price: 165, qty: 2 }
  ], checkout: [610, 0, 66.9, 676.9] },
  { id: 1002, coupon: 'SAVE10', items: [
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
    { id: 4, sku: 'OIL-001', name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
  ], checkout: [1020, 102, 45.9, 963.9] },
  { id: 1004, coupon: 'SAVE10', items: [
    { id: 5, sku: 'OIL-002', name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
  ], checkout: [2240, 150, 104.5, 2194.5] },
  { id: 1008, coupon: '', items: [
    { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 140, qty: 1 },
    { id: 12, sku: 'BEV-003', name: 'Sherbet', hsn: '2106', price: 180, qty: 2 }
  ], checkout: [500, 0, 90, 590] },
  { id: 'mixed-5-and-12', coupon: '', items: [
    { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
    { id: 6, name: 'Ghee', hsn: '0405', price: 450, qty: 1 }
  ], checkout: [1090, 0, 86, 1176] }
];
function amounts(figures) {
  return ['subtotal', 'discount', 'tax', 'total'].map(key => figures[key]);
}
for (const sample of cases) {
  test((sample.id === 1008 ? 'CURRENT BEHAVIOUR: ' : 'FIXED: ') + 'invoice matches checkout for order ' + sample.id, () => {
    assert.deepEqual(amounts(pricing.computeTotals(sample.items, sample.coupon)), sample.checkout);
    assert.deepEqual(amounts(invoice.computeInvoiceFigures(sample)), sample.checkout);
  });
}
test('CURRENT BEHAVIOUR: explicit percentage GST and row display fields are preserved', () => {
  const item = { id: 1, sku: 'TEST', name: 'Explicit GST', hsn: '1006', gstRate: 12, price: 100, qty: 2 };
  const result = invoice.computeInvoiceFigures({ items: [item] });
  assert.deepEqual(amounts(result), [200, 0, 24, 224]);
  assert.deepEqual(result.rows, [{ name: item.name, sku: 'TEST', hsn: '1006', qty: 2, price: 100,
    gstPercent: 12, line: 200, lineTax: 24 }]);
  assert.equal(result.cgst, 12);
  assert.equal(result.sgst, 12);
});
test('CURRENT BEHAVIOUR: absent items produce an empty zero invoice', () => {
  assert.deepEqual(invoice.computeInvoiceFigures({}), {
    subtotal: 0, discount: 0, tax: 0, cgst: 0, sgst: 0, total: 0, rows: []
  });
});

test('REGRESSION: SAVE10 invoice must match checkout before-tax discount and HSN GST', () => {
  const sample = cases.find(order => order.id === 1002);
  assert.deepEqual(amounts(invoice.computeInvoiceFigures(sample)), sample.checkout);
});

test('REGRESSION: HSN rates and tax after discount appear on each invoice row', () => {
  const result = invoice.computeInvoiceFigures(cases[1]);
  assert.deepEqual(result.rows.map(row => [row.gstPercent, row.line, row.lineTax]),
    [[5, 640, 28.8], [5, 380, 17.1]]);
  assert.equal(result.cgst, 22.95);
  assert.equal(result.sgst, 22.95);
});
for (const [label, code, price, expected] of [
  ['normalized percent code', ' save10 ', 1000, [1000, 100, 45, 945]],
  ['below minimum', 'SAVE10', 400, [400, 0, 20, 420]],
  ['expired coupon', 'DIWALI20', 1200, [1200, 0, 60, 1260]],
  ['unknown coupon', 'NOT-A-COUPON', 1000, [1000, 0, 50, 1050]],
  ['flat discount before tax', 'FLAT50', 500, [500, 50, 22.5, 472.5]],
  ['percent cap', 'SAVE10', 2240, [2240, 150, 104.5, 2194.5]]
]) {
  test('REGRESSION: coupon ' + label, () => {
    const order = { coupon: code, items: [{ name: 'Rice', hsn: '1006', price, qty: 1 }] };
    assert.deepEqual(amounts(invoice.computeInvoiceFigures(order)), expected);
  });
}
for (const [label, gstRate, expectedTax, expectedPercent] of [
  ['zero', 0, 0, 0], ['fraction', 0.12, 12, 12], ['percentage', 12, 12, 12]
]) {
  test('REGRESSION: explicit ' + label + ' GST overrides HSN', () => {
    const order = { items: [{ name: 'Explicit rate', hsn: '1006', gstRate, price: 100, qty: 1 }] };
    const result = invoice.computeInvoiceFigures(order);
    assert.equal(result.tax, expectedTax);
    assert.equal(result.rows[0].gstPercent, expectedPercent);
  });
}
test('REGRESSION: per-line rounding and odd-paise GST split match checkout', () => {
  const order = { items: [
    { name: 'Small A', price: 0.1, qty: 1 }, { name: 'Small B', price: 0.1, qty: 1 }
  ] };
  const result = invoice.computeInvoiceFigures(order);
  assert.deepEqual(amounts(result), [0.2, 0, 0.04, 0.24]);
  const odd = invoice.computeInvoiceFigures({ items: [{ name: 'Odd', hsn: '1006', price: 0.2, qty: 1 }] });
  assert.equal(odd.tax, 0.01);
  assert.equal(odd.cgst, 0.01);
  assert.equal(odd.sgst, 0);
});
test('REGRESSION: printable invoice matches billed total, escapes names and leaves order unchanged', () => {
  const order = { ...cases[1], total: 963.9, customer: '<script>alert(1)</script>' };
  const original = structuredClone(order);
  const html = invoice.render(order);
  assert.match(html, /963\.90/);
  assert.match(html, /45\.90/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice:/);
  assert.deepEqual(order, original);
  assert.match(invoice.render({ ...order, total: 900 }), /Accountant Reconciliation Notice:/);
});
