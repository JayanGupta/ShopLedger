'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: order #1001, mixed 5% and 12% items, no coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        item('Unpolished Toor Dal 1kg', 165, 2, '0713', 5),
        item('A2 Gir Cow Ghee 500ml', 450, 2, '0405', 12)
      ]
    },
    invoice: { subtotal: 1230, discount: 0, tax: 124.5, cgst: 62.25, sgst: 62.25, total: 1354.5, gst: [5, 12] },
    pricing: { subtotal: 1230, discount: 0, tax: 124.5, total: 1354.5, gst: [5, 12] },
    looksWrong: false
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1002, SAVE10 on 5% items',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        item('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
        item('Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
      ]
    },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gst: [5, 5] },
    pricing: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, gst: [5, 5] },
    looksWrong: true
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1004, SAVE10 cap on ₹2,240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [item('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gst: [5] },
    pricing: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5, gst: [5] },
    looksWrong: true
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008, all 18% items, no coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        item('Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
        item('Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
      ]
    },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gst: [18, 18] },
    pricing: { subtotal: 500, discount: 0, tax: 90, total: 590, gst: [18, 18] },
    looksWrong: false
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const invoiceFigures = invoice.computeInvoiceFigures(scenario.order);
    const pricingFigures = pricing.computeTotals(scenario.order.items, scenario.order.coupon);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        gst: invoiceFigures.rows.map((row) => row.gstPercent)
      },
      scenario.invoice
    );
    assert.deepEqual(
      {
        subtotal: pricingFigures.subtotal,
        discount: pricingFigures.discount,
        tax: pricingFigures.tax,
        total: pricingFigures.total,
        gst: pricingFigures.lines.map((line) => line.gstPercent)
      },
      scenario.pricing
    );
  });
}

test('Invoice parity: invoice totals and per-line GST match checkout', () => {
  for (const scenario of cases) {
    const invoiceFigures = invoice.computeInvoiceFigures(scenario.order);
    const checkoutFigures = pricing.computeTotals(scenario.order.items, scenario.order.coupon);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        rows: invoiceFigures.rows.map((row) => ({ gstPercent: row.gstPercent, tax: row.lineTax }))
      },
      {
        subtotal: checkoutFigures.subtotal,
        discount: checkoutFigures.discount,
        tax: checkoutFigures.tax,
        cgst: checkoutFigures.cgst,
        sgst: checkoutFigures.sgst,
        total: checkoutFigures.total,
        rows: checkoutFigures.lines.map((line) => ({ gstPercent: line.gstPercent, tax: line.tax }))
      },
      scenario.name
    );
  }
});
