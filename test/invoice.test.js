const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('Invoice matches checkout HSN GST and capped pre-tax coupon, including printed figures', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 160, qty: 7, hsn: '1006' },
      { name: 'Butter', price: 280, qty: 4, hsn: '0405' }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  order.total = checkout.total;
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(
    [figures.subtotal, figures.discount, figures.tax, figures.cgst, figures.sgst, figures.total],
    [2240, 150, 177.65, 88.83, 88.82, 2267.65]
  );
  assert.equal(figures.total, checkout.total);
  assert.deepStrictEqual(figures.rows.map(row => row.gstPercent), [5, 12]);
  assert.deepStrictEqual(figures.rows.map(row => row.lineTax), [52.25, 125.4]);

  const html = invoice.render(order);
  assert.match(html, /5%/);
  assert.match(html, /12%/);
  assert.match(html, /₹52\.25/);
  assert.match(html, /₹125\.40/);
  assert.match(html, /-₹150\.00/);
  assert.match(html, /₹2267\.65/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

// Synthetic orders model the requested scenarios without loading persisted data.
// Undefined gstRate models saved lines that rely on HSN at checkout.
const scenarios = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice uses HSN 5% and 12% like checkout',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
        { name: 'Butter', price: 200, qty: 2, hsn: '0405', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 600, discount: 0, tax: 58,
      cgst: 29, sgst: 29, total: 658
    },
    expectedRows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 100, gstPercent: 5, line: 200, lineTax: 10 },
      { name: 'Butter', sku: '-', hsn: '0405', qty: 2, price: 200, gstPercent: 12, line: 400, lineTax: 48 }
    ],
    expectedCheckout: {
      subtotal: 600, discount: 0, taxable: 600, tax: 58,
      cgst: 29, sgst: 29, total: 658
    },
    checkoutRates: [5, 12],
    checkoutLineTaxes: [10, 48]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before HSN GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
        { name: 'Butter', price: 200, qty: 2, hsn: '0405', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 600, discount: 60, tax: 52.2,
      cgst: 26.1, sgst: 26.1, total: 592.2
    },
    expectedRows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 100, gstPercent: 5, line: 200, lineTax: 9 },
      { name: 'Butter', sku: '-', hsn: '0405', qty: 2, price: 200, gstPercent: 12, line: 400, lineTax: 43.2 }
    ],
    expectedCheckout: {
      subtotal: 600, discount: 60, taxable: 540, tax: 52.2,
      cgst: 26.1, sgst: 26.1, total: 592.2
    },
    checkoutRates: [5, 12],
    checkoutLineTaxes: [9, 43.2]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice caps SAVE10 at 150 before HSN GST',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 160, qty: 7, hsn: '1006', gstRate: undefined },
        { name: 'Butter', price: 280, qty: 4, hsn: '0405', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 2240, discount: 150, tax: 177.65,
      cgst: 88.83, sgst: 88.82, total: 2267.65
    },
    expectedRows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 7, price: 160, gstPercent: 5, line: 1120, lineTax: 52.25 },
      { name: 'Butter', sku: '-', hsn: '0405', qty: 4, price: 280, gstPercent: 12, line: 1120, lineTax: 125.4 }
    ],
    expectedCheckout: {
      subtotal: 2240, discount: 150, taxable: 2090, tax: 177.65,
      cgst: 88.83, sgst: 88.82, total: 2267.65
    },
    checkoutRates: [5, 12],
    checkoutLineTaxes: [52.25, 125.4]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18% without a coupon matches checkout',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: 18 },
        { name: 'Coffee', price: 200, qty: 2, hsn: '0901', gstRate: 18 }
      ]
    },
    expectedInvoice: {
      subtotal: 600, discount: 0, tax: 108,
      cgst: 54, sgst: 54, total: 708
    },
    expectedRows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 2, price: 100, gstPercent: 18, line: 200, lineTax: 36 },
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 2, price: 200, gstPercent: 18, line: 400, lineTax: 72 }
    ],
    expectedCheckout: {
      subtotal: 600, discount: 0, taxable: 600, tax: 108,
      cgst: 54, sgst: 54, total: 708
    },
    checkoutRates: [18, 18],
    checkoutLineTaxes: [36, 72]
  }
];

for (const scenario of scenarios) {
  test(scenario.name, () => {
    const order = scenario.order;
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepStrictEqual(invoiceFigures, {
      ...scenario.expectedInvoice,
      rows: scenario.expectedRows
    });

    const { lines, ...checkoutSummary } = checkout;
    assert.deepStrictEqual(checkoutSummary, scenario.expectedCheckout);
    assert.deepStrictEqual(lines.map(line => line.gstPercent), scenario.checkoutRates);
    assert.deepStrictEqual(lines.map(line => line.tax), scenario.checkoutLineTaxes);
  });
}
