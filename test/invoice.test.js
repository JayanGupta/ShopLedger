const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// In-memory fixtures only. gstRate is deliberately absent: these lines exercise
// HSN lookup shared by checkout and the invoice.
// The #1001-style fixture uses the requested 5%/12% mix.
const cases = [
  {
    name: '#1001-style invoice uses mixed HSN slabs like checkout',
    order: { id: 1001, coupon: '', items: [
      { name: 'Dal', hsn: '0713', price: 165, qty: 2 },
      { name: 'Butter', hsn: '0405', price: 260, qty: 1 }
    ] },
    figures: { subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7 },
    rows: [
      { name: 'Dal', sku: '-', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'Butter', sku: '-', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
    ],
    checkout: { discount: 0, tax: 47.7, total: 637.7, slabs: [5, 12] }
  },
  {
    name: '#1002 invoice applies SAVE10 before GST like checkout',
    order: { id: 1002, coupon: 'SAVE10', items: [
      { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ] },
    figures: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower oil', sku: '-', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ],
    checkout: { discount: 102, tax: 45.9, total: 963.9, slabs: [5, 5] }
  },
  {
    name: '#1004 invoice respects SAVE10 cap like checkout',
    order: { id: 1004, coupon: 'SAVE10', items: [
      { name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
    ] },
    figures: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    rows: [
      { name: 'Groundnut oil', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ],
    checkout: { discount: 150, tax: 104.5, total: 2194.5, slabs: [5] }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18% without coupon matches checkout',
    order: { id: 1008, coupon: '', items: [
      { name: 'Tea', hsn: '0902', price: 140, qty: 1 },
      { name: 'Kokum concentrate', hsn: '2106', price: 180, qty: 2 }
    ] },
    figures: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum concentrate', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ],
    checkout: { discount: 0, tax: 90, total: 590, slabs: [18, 18] }
  }
];

for (const fixture of cases) {
  test(fixture.name, () => {
    const actualInvoice = invoice.computeInvoiceFigures(fixture.order);
    const actualCheckout = pricing.computeTotals(fixture.order.items, fixture.order.coupon);

    assert.deepStrictEqual(actualInvoice, { ...fixture.figures, rows: fixture.rows });
    assert.deepStrictEqual({
      discount: actualCheckout.discount,
      tax: actualCheckout.tax,
      total: actualCheckout.total,
      slabs: actualCheckout.lines.map(line => line.gstPercent)
    }, fixture.checkout);
    assert.strictEqual(actualCheckout.subtotal, fixture.figures.subtotal);
  });
}

test('Invoice matches checkout totals and per-line GST after capped coupon discount', () => {
  const items = [
    { name: 'Rice', sku: 'RICE', hsn: '1006', price: 1120, qty: 2 },
    { name: 'Butter', sku: 'BUTTER', hsn: '0405', price: 260, qty: 1 },
    { name: 'Tea', sku: 'TEA', hsn: '0902', price: 140, qty: 1 }
  ];
  const billed = pricing.computeTotals(items, 'SAVE10');
  assert.strictEqual(billed.discount, 150);
  const order = { id: 2001, items, coupon: 'SAVE10', ...billed };
  const actual = invoice.computeInvoiceFigures(order);
  for (const key of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
    assert.strictEqual(actual[key], billed[key], key);
  }
  assert.deepStrictEqual(actual.rows.map(row => ({
    gstPercent: row.gstPercent, lineTax: row.lineTax, line: row.line
  })), billed.lines.map(line => ({
    gstPercent: line.gstPercent, lineTax: line.tax, line: line.gross
  })));
  const html = invoice.render(order);
  assert.ok(html.includes('₹' + billed.total.toFixed(2)));
  assert.ok(!html.includes('Accountant Reconciliation Notice:'));
});
