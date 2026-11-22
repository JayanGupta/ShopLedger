const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('printable invoice matches checkout totals and the post-discount GST breakdown', () => {
  const mixedItems = [
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 1000, qty: 1 },
    { id: 2, name: 'Butter', sku: 'BUTTER', hsn: '0405', price: 1000, qty: 1 },
    { id: 3, name: 'Tea', sku: 'TEA', hsn: '0902', price: 1000, qty: 1 }
  ];
  // All fixtures are in memory; expected amounts are independent of invoice.js.
  const cases = [
    {
      name: 'order #1001 reproduction',
      items: [
        { id: 8, name: 'Tea', hsn: '0902', price: 140, qty: 2 },
        { id: 2, name: 'Dal', hsn: '0713', price: 165, qty: 2 }
      ],
      coupon: '', subtotal: 610, discount: 0, tax: 66.90, total: 676.90,
      rates: [18, 5], taxes: [50.40, 16.50]
    },
    {
      name: 'mixed slabs without a coupon', items: mixedItems, coupon: '',
      subtotal: 3000, discount: 0, tax: 350, total: 3350,
      rates: [5, 12, 18], taxes: [50, 120, 180]
    },
    {
      name: 'SAVE10 percentage cap', items: mixedItems, coupon: 'SAVE10',
      subtotal: 3000, discount: 150, tax: 332.50, total: 3182.50,
      rates: [5, 12, 18], taxes: [47.50, 114, 171]
    },
    {
      name: 'FLAT50 proportional allocation and rounding', items: mixedItems, coupon: 'FLAT50',
      subtotal: 3000, discount: 50, tax: 344.17, total: 3294.17,
      rates: [5, 12, 18], taxes: [49.17, 118, 177]
    },
    {
      name: 'WELCOME percentage cap', items: mixedItems, coupon: 'WELCOME',
      subtotal: 3000, discount: 100, tax: 338.33, total: 3238.33,
      rates: [5, 12, 18], taxes: [48.33, 116, 174]
    },
    {
      name: 'WHOLESALE15 percentage cap', items: mixedItems, coupon: 'WHOLESALE15',
      subtotal: 3000, discount: 400, tax: 303.33, total: 2903.33,
      rates: [5, 12, 18], taxes: [43.33, 104, 156]
    },
    {
      name: 'below coupon minimum', items: [mixedItems[0]], coupon: 'WHOLESALE15',
      subtotal: 1000, discount: 0, tax: 50, total: 1050,
      rates: [5], taxes: [50]
    },
    {
      name: 'explicit decimal and exempt rates plus unknown HSN fallback',
      items: [
        { name: 'Override', price: 100, qty: 1, gstRate: 0.12 },
        { name: 'Exempt', price: 100, qty: 1, gstRate: 0 },
        { name: 'Unknown HSN', price: 100, qty: 1, hsn: 'unknown' }
      ],
      coupon: '', subtotal: 300, discount: 0, tax: 30, total: 330,
      rates: [12, 0, 18], taxes: [12, 0, 18]
    }
  ];

  for (const fixture of cases) {
    const order = {
      id: 1001, date: '28/12/2021', customer: 'Test customer', paymentMode: 'cash',
      items: fixture.items, coupon: fixture.coupon,
      subtotal: fixture.subtotal, discount: fixture.discount, tax: fixture.tax, total: fixture.total
    };
    const expected = {
      subtotal: fixture.subtotal, discount: fixture.discount, tax: fixture.tax, total: fixture.total
    };
    const checkout = pricing.computeTotals(order.items, order.coupon);
    const actual = invoice.computeInvoiceFigures(order);
    for (const key of Object.keys(expected)) {
      assert.equal(checkout[key], expected[key], fixture.name + ': checkout ' + key);
      assert.equal(actual[key], expected[key], fixture.name + ': invoice ' + key);
    }
    assert.equal(actual.cgst, checkout.cgst, fixture.name + ': CGST');
    assert.equal(actual.sgst, checkout.sgst, fixture.name + ': SGST');
    assert.deepEqual(actual.rows.map(row => row.gstPercent), fixture.rates, fixture.name + ': slabs');
    assert.deepEqual(actual.rows.map(row => row.lineTax), fixture.taxes, fixture.name + ': line tax');
    const html = invoice.render(order);
    assert.ok(html.includes('₹' + fixture.total.toFixed(2)), fixture.name + ': printed total');
    assert.ok(html.includes('₹' + fixture.tax.toFixed(2)), fixture.name + ': printed GST');
    assert.ok(!html.includes('Accountant Reconciliation Notice:'), fixture.name + ': no mismatch');
  }
});
