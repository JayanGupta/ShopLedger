'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Snapshot just the fields used by invoice calculations. The GST rate is in
// percent here because invoice.computeInvoiceFigures divides it by 100.
function line(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

const cases = [
  {
    id: 1001,
    label: '#1001 mixed 5% and 12% GST, no coupon',
    items: [
      line('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
      line('A2 Gir Cow Ghee 500ml', 450, 1, '0405', 12)
    ],
    coupon: '',
    expectedInvoice: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    expectedPricing: { subtotal: 1090, discount: 0, tax: 86, total: 1176 },
    expectedInvoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 32 },
      { hsn: '0405', gstPercent: 12, line: 450, lineTax: 54 }
    ]
  },
  {
    id: 1002,
    label: '#1002 SAVE10',
    items: [
      line('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
      line('Assam CTC Masala Chai 250g', 140, 1, '0902', 18)
    ],
    coupon: 'SAVE10',
    expectedInvoice: { subtotal: 780, discount: 78, tax: 51.48, cgst: 25.74, sgst: 25.74, total: 753.48 },
    expectedPricing: { subtotal: 780, discount: 78, tax: 51.48, total: 753.48 },
    expectedInvoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
      { hsn: '0902', gstPercent: 18, line: 140, lineTax: 22.68 }
    ]
  },
  {
    id: 1004,
    label: '#1004 SAVE10 at ₹2,240 subtotal (coupon cap)',
    items: [line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)],
    coupon: 'SAVE10',
    expectedInvoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    expectedPricing: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 },
    expectedInvoiceRows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  },
  {
    id: 1008,
    label: '#1008 all 18% GST, no coupon',
    items: [
      line('Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
      line('Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
    ],
    coupon: '',
    expectedInvoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    expectedPricing: { subtotal: 500, discount: 0, tax: 90, total: 590 },
    expectedInvoiceRows: [
      { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.2 },
      { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }
];

function selectInvoiceFigures(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

function selectPricingFigures(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    total: figures.total
  };
}

for (const scenario of cases) {
  test(`CURRENT BEHAVIOUR: invoice figures for ${scenario.label}`, () => {
    const order = { id: scenario.id, items: scenario.items, coupon: scenario.coupon };

    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const pricingFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual(selectInvoiceFigures(invoiceFigures), scenario.expectedInvoice);
    assert.deepEqual(selectPricingFigures(pricingFigures), scenario.expectedPricing);
    assert.deepEqual(
      invoiceFigures.rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax })),
      scenario.expectedInvoiceRows
    );
  });
}

test('invoice matches checkout HSN GST and capped coupon calculation', () => {
  // Persisted order lines contain HSN, but no gstRate field; checkout resolves
  // their slab from config.tax.hsnSlabs.
  const order = {
    id: 1004,
    items: [line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')],
    coupon: 'SAVE10'
  };

  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.equal(invoiceFigures.subtotal, checkoutFigures.subtotal);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
  assert.deepEqual(
    invoiceFigures.rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })),
    checkoutFigures.lines.map(({ hsn, gstPercent, tax }) => ({ hsn, gstPercent, lineTax: tax }))
  );
});
