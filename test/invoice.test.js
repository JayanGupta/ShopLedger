'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// In-memory snapshots model the requested order shapes; no fixture uses db.json.
function line(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/ /g, '-'), price, qty, hsn, gstRate };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 mixed 5% and 18% order without coupon',
    order: {
      id: 1001,
      items: [
        line('Assam CTC Masala Chai 250g', 140, 2, '0902'),
        line('Unpolished Toor Dal 1kg', 165, 2, '0713')
      ],
      coupon: ''
    },
    expectedInvoice: {
      subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
      rows: [
        { gstPercent: 18, line: 280, lineTax: 50.4 },
        { gstPercent: 5, line: 330, lineTax: 16.5 }
      ]
    },
    expectedPricing: { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 is applied before tax',
    order: {
      id: 1002,
      items: [line('Rice', 1000, 1, '1006'), line('Ghee', 500, 1, '0405')],
      coupon: 'SAVE10'
    },
    expectedInvoice: {
      subtotal: 1500, discount: 150, tax: 99, cgst: 49.5, sgst: 49.5, total: 1449,
      rows: [
        { gstPercent: 5, line: 1000, lineTax: 45 },
        { gstPercent: 12, line: 500, lineTax: 54 }
      ]
    },
    expectedPricing: { subtotal: 1500, discount: 150, tax: 99, total: 1449 }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 SAVE10 honors the ₹150 cap before tax',
    order: {
      id: 1004,
      items: [line('Rice', 1000, 1, '1006'), line('Ghee', 1240, 1, '0405')],
      coupon: 'SAVE10'
    },
    expectedInvoice: {
      subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49,
      rows: [
        { gstPercent: 5, line: 1000, lineTax: 46.65 },
        { gstPercent: 12, line: 1240, lineTax: 138.84 }
      ]
    },
    expectedPricing: { subtotal: 2240, discount: 150, tax: 185.49, total: 2275.49 }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% order without coupon',
    order: {
      id: 1008,
      items: [line('Packaged Tea', 250, 2, '0902'), line('Coffee', 500, 1, '0901')],
      coupon: ''
    },
    expectedInvoice: {
      subtotal: 1000, discount: 0, tax: 180, cgst: 90, sgst: 90, total: 1180,
      rows: [
        { gstPercent: 18, line: 500, lineTax: 90 },
        { gstPercent: 18, line: 500, lineTax: 90 }
      ]
    },
    expectedPricing: { subtotal: 1000, discount: 0, tax: 180, total: 1180 }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const order = scenario.order;
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const pricingFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        rows: invoiceFigures.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax }))
      },
      scenario.expectedInvoice
    );
    assert.deepEqual(
      {
        subtotal: pricingFigures.subtotal,
        discount: pricingFigures.discount,
        tax: pricingFigures.tax,
        total: pricingFigures.total
      },
      scenario.expectedPricing
    );
  });
}

test('CURRENT BEHAVIOUR: invoice uses checkout HSN slabs and capped pre-tax coupon discount', () => {
  const order = {
    id: 1004,
    items: [line('Rice', 1000, 1, '1006'), line('Ghee', 1240, 1, '0405')],
    coupon: 'SAVE10'
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      lines: invoiceFigures.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, gross: line, tax: lineTax }))
    },
    {
      subtotal: pricingFigures.subtotal,
      discount: pricingFigures.discount,
      tax: pricingFigures.tax,
      cgst: pricingFigures.cgst,
      sgst: pricingFigures.sgst,
      total: pricingFigures.total,
      lines: pricingFigures.lines.map(({ gstPercent, gross, tax }) => ({ gstPercent, gross, tax }))
    }
  );
});
