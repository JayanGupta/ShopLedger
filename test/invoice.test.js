const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Hand-built fixtures: no filesystem or store imports, no application database.
const cases = [
  { label: '#1001 mixed HSN, no coupon', items: [
    { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
    { name: 'Dal', price: 165, qty: 2, hsn: '0713' }
  ], coupon: '', expected: [610, 0, 66.9, 676.9] },
  { label: '#1002 SAVE10', items: [
    { name: 'Rice', price: 1020, qty: 1, hsn: '1006' }
  ], coupon: 'SAVE10', expected: [1020, 102, 45.9, 963.9] },
  { label: '#1004 capped SAVE10', items: [
    { name: 'Oil', price: 2240, qty: 1, hsn: '1508' }
  ], coupon: 'SAVE10', expected: [2240, 150, 104.5, 2194.5] },
  { label: '#1008 18 percent, no coupon', items: [
    { name: 'Tea', price: 250, qty: 2, hsn: '0902' }
  ], coupon: '', expected: [500, 0, 90, 590] }
];
const figures = value => ['subtotal', 'discount', 'tax', 'total'].map(key => value[key]);

test('REGRESSION: SAVE10 invoice matches billed total and discounted line GST', () => {
  const order = cases[1];
  const actual = invoice.computeInvoiceFigures(order);
  assert.deepEqual(figures(actual), [1020, 102, 45.9, 963.9]);
  assert.equal(actual.rows[0].gstPercent, 5);
  assert.equal(actual.rows[0].lineTax, 45.9);
});

for (const fixture of cases) {
  test((fixture.coupon || fixture.label.includes('1001') ? 'REGRESSION: ' : 'CURRENT BEHAVIOUR: ') + fixture.label, () => {
    assert.deepEqual(figures(pricing.computeTotals(fixture.items, fixture.coupon)), fixture.expected);
    assert.deepEqual(figures(invoice.computeInvoiceFigures(fixture)), fixture.expected);
  });
}

const edges = [
  { name: 'mixed 5/12 percent HSN and FLAT50', items: [
    { name: 'Rice', price: 200, qty: 2, hsn: '1006' },
    { name: 'Butter', price: 100, qty: 1, hsn: '0405' }
  ], coupon: 'FLAT50', expected: [500, 50, 28.8, 478.8] },
  { name: 'explicit zero rate overrides HSN', items: [
    { name: 'Zero-rated', price: 100, qty: 1, hsn: '0405', gstRate: 0 }
  ], expected: [100, 0, 0, 100] },
  { name: 'fractional and percentage rate overrides', items: [
    { price: 100, qty: 1, gstRate: 0.12 }, { price: 100, qty: 1, gstRate: 5 }
  ], expected: [200, 0, 17, 217] },
  { name: 'missing HSN falls back to 18 percent', items: [
    { price: 100, qty: 1 }
  ], expected: [100, 0, 18, 118] },
  { name: 'empty order', items: [], expected: [0, 0, 0, 0] },
  { name: 'expired coupon ignored', items: [{ price: 1200, qty: 1, hsn: '1006' }],
    coupon: 'DIWALI20', expected: [1200, 0, 60, 1260] },
  { name: 'below coupon minimum', items: [{ price: 499, qty: 1, hsn: '1006' }],
    coupon: 'SAVE10', expected: [499, 0, 24.95, 523.95] },
  { name: 'coupon normalized', items: [{ price: 500, qty: 1, hsn: '1006' }],
    coupon: ' save10 ', expected: [500, 50, 22.5, 472.5] },
  { name: 'per-line rounding and odd-paise GST split', items: [
    { price: 0.1, qty: 1, gstRate: 5 }, { price: 0.2, qty: 1, gstRate: 12 }
  ], expected: [0.3, 0, 0.03, 0.33] }
];

for (const fixture of edges) {
  test(fixture.name, () => {
    const before = structuredClone(fixture);
    const actual = invoice.computeInvoiceFigures(fixture);
    const checkout = pricing.computeTotals(fixture.items, fixture.coupon);
    assert.deepEqual(figures(actual), fixture.expected);
    assert.deepEqual(figures(actual), figures(checkout));
    assert.equal(actual.cgst, checkout.cgst);
    assert.equal(actual.sgst, checkout.sgst);
    assert.equal(pricing.round2(actual.cgst + actual.sgst), actual.tax);
    actual.rows.forEach((row, i) => {
      assert.equal(row.lineTax, checkout.lines[i].tax);
      assert.equal(row.gstPercent, checkout.lines[i].gstPercent);
      assert.equal(row.line, checkout.lines[i].gross);
    });
    assert.deepEqual(fixture, before, 'invoice must not mutate the order');
  });
}

test('render preserves row metadata, escaping, and reconciliation notice', () => {
  const order = { id: 42, items: [{ name: '<Rice>', sku: 'R&1', hsn: '1006', price: 1020, qty: 1 }],
    coupon: 'SAVE10', total: 963.9 };
  const html = invoice.render(order);
  assert.match(html, /&lt;Rice&gt;/);
  assert.match(html, /R&amp;1/);
  assert.match(html, /963\.90/);
  assert.match(html, /45\.90/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.match(invoice.render({ ...order, total: 1 }), /Accountant Reconciliation Notice/);
});
