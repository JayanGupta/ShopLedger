const test = require('node:test');
const assert = require('node:assert').strict;
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Hand-built fixtures only: no store, server, or database-file access.
// Undefined gstRate exercises HSN lookup without an explicit rate override.
// These pin invoice and checkout figures for the same in-memory orders.
const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-style invoice uses 5% and 12% HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      // A requested 5% / 12% mix, not a copy of the historical order.
      items: [
        { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 6, name: 'Ghee', sku: 'GHEE', price: 450, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    expectedInvoice: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    expectedInvoiceRows: [
      { hsn: '1006', gstPercent: 5, lineTax: 32 },
      { hsn: '0405', gstPercent: 12, lineTax: 54 }
    ],
    expectedCheckout: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    expectedCheckoutLines: [
      { gstPercent: 5, discount: 0, taxable: 640, tax: 32 },
      { gstPercent: 12, discount: 0, taxable: 450, tax: 54 }
    ],
    matchesCheckout: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 invoice discounts before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 4, name: 'Sunflower oil', sku: 'OIL', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
      ]
    },
    expectedInvoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    expectedInvoiceRows: [
      { hsn: '1006', gstPercent: 5, lineTax: 28.8 },
      { hsn: '1512', gstPercent: 5, lineTax: 17.1 }
    ],
    expectedCheckout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    expectedCheckoutLines: [
      { gstPercent: 5, discount: 64, taxable: 576, tax: 28.8 },
      { gstPercent: 5, discount: 38, taxable: 342, tax: 17.1 }
    ],
    matchesCheckout: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 SAVE10 invoice respects the 150 rupee cap',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, name: 'Groundnut oil', sku: 'BULK-OIL', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
      ]
    },
    expectedInvoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    expectedInvoiceRows: [
      { hsn: '1508', gstPercent: 5, lineTax: 104.5 }
    ],
    expectedCheckout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    expectedCheckoutLines: [
      { gstPercent: 5, discount: 150, taxable: 2090, tax: 104.5 }
    ],
    matchesCheckout: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18% without coupon matches checkout',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 8, name: 'Tea', sku: 'TEA', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
        { id: 12, name: 'Sherbet', sku: 'SHERBET', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
      ]
    },
    expectedInvoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    expectedInvoiceRows: [
      { hsn: '0902', gstPercent: 18, lineTax: 25.2 },
      { hsn: '2106', gstPercent: 18, lineTax: 64.8 }
    ],
    expectedCheckout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    expectedCheckoutLines: [
      { gstPercent: 18, discount: 0, taxable: 140, tax: 25.2 },
      { gstPercent: 18, discount: 0, taxable: 360, tax: 64.8 }
    ],
    matchesCheckout: true
  }
];

function figures(result) {
  const { subtotal, discount, tax, cgst, sgst, total } = result;
  return { subtotal, discount, tax, cgst, sgst, total };
}

for (const scenario of cases) {
  test(scenario.name, () => {
    const order = scenario.order;
    const billed = pricing.computeTotals(order.items, order.coupon);
    const printed = invoice.computeInvoiceFigures(order);

    assert.deepStrictEqual(figures(printed), scenario.expectedInvoice, 'current invoice figures');
    assert.deepStrictEqual(printed.rows.map(({ hsn, gstPercent, lineTax }) => (
      { hsn, gstPercent, lineTax }
    )), scenario.expectedInvoiceRows, 'current invoice GST breakdown');

    assert.deepStrictEqual(figures(billed), scenario.expectedCheckout, 'current checkout figures');
    assert.deepStrictEqual(billed.lines.map(({ gstPercent, discount, taxable, tax }) => (
      { gstPercent, discount, taxable, tax }
    )), scenario.expectedCheckoutLines, 'current checkout discount and GST allocation');

    assert.strictEqual(printed.total === billed.total, scenario.matchesCheckout, 'total agreement today');
    assert.strictEqual(printed.tax === billed.tax, scenario.matchesCheckout, 'GST agreement today');
  });
}

test('Invoice figures and per-line GST match checkout billing, including capped coupons', () => {
  for (const { order } of cases) {
    const billed = pricing.computeTotals(order.items, order.coupon);
    const printed = invoice.computeInvoiceFigures(order);
    assert.deepStrictEqual(figures(printed), figures(billed), 'order #' + order.id);
    assert.deepStrictEqual(
      printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax })),
      billed.lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })),
      'per-line GST for order #' + order.id
    );
    const html = invoice.render({ ...order, ...figures(billed) });
    assert.ok(html.includes('₹' + billed.total.toFixed(2)), 'billed total is rendered');
    assert.ok(!html.includes('Accountant Reconciliation Notice:'), 'no false billing mismatch');
  }
});
