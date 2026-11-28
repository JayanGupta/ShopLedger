'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

const orders = [
  {
    name: 'CURRENT BEHAVIOUR: order #1001 style mixed 5% and 12% lines without a coupon',
    id: 1001,
    items: [item('Toor Dal', 165, 2, '0713', 5), item('Butter', 260, 1, '0405', 12)],
    coupon: '',
    invoiceExpected: {
      subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7,
      rows: [
        { name: 'Toor Dal', sku: '-', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
        { name: 'Butter', sku: '-', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
      ]
    },
    pricingExpected: { subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1002 style SAVE10 applies capped discount before GST',
    id: 1002,
    items: [item('Rice', 640, 1, '1006', 5), item('Sunflower Oil', 190, 2, '1512', 5)],
    coupon: 'SAVE10',
    invoiceExpected: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Sunflower Oil', sku: '-', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    pricingExpected: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1004 style SAVE10 respects checkout ₹150 maximum before GST',
    id: 1004,
    items: [item('Groundnut Oil', 1120, 2, '1508', 5)],
    coupon: 'SAVE10',
    invoiceExpected: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Groundnut Oil', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    pricingExpected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 style all 18% lines without a coupon',
    id: 1008,
    items: [item('Tea', 140, 1, '0902', 18), item('Kokum Sherbet', 180, 2, '2106', 18)],
    coupon: '',
    invoiceExpected: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { name: 'Tea', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum Sherbet', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    pricingExpected: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  }
];

for (const scenario of orders) {
  test(scenario.name, () => {
    const order = { id: scenario.id, items: scenario.items, coupon: scenario.coupon };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual(invoiceFigures, scenario.invoiceExpected);
    assert.deepEqual(
      {
        subtotal: checkoutFigures.subtotal,
        discount: checkoutFigures.discount,
        tax: checkoutFigures.tax,
        cgst: checkoutFigures.cgst,
        sgst: checkoutFigures.sgst,
        total: checkoutFigures.total
      },
      scenario.pricingExpected
    );
  });
}


test('invoice figures match checkout for HSN slabs and coupon-adjusted taxable values', () => {
  const cases = [
    {
      id: 1001,
      coupon: '',
      items: [item('Toor Dal', 165, 2, '0713'), item('Butter', 260, 1, '0405')]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [item('Rice', 640, 1, '1006'), item('Sunflower Oil', 190, 2, '1512')]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [item('Groundnut Oil', 1120, 2, '1508')]
    },
    {
      id: 1008,
      coupon: '',
      items: [item('Tea', 140, 1, '0902'), item('Kokum Sherbet', 180, 2, '2106')]
    }
  ];

  for (const scenario of cases) {
    const order = { id: scenario.id, items: scenario.items, coupon: scenario.coupon };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total
      },
      {
        subtotal: checkoutFigures.subtotal,
        discount: checkoutFigures.discount,
        tax: checkoutFigures.tax,
        cgst: checkoutFigures.cgst,
        sgst: checkoutFigures.sgst,
        total: checkoutFigures.total
      },
      `invoice figures for order #${scenario.id}`
    );
    assert.deepEqual(
      invoiceFigures.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
      checkoutFigures.lines.map((line) => ({ gstPercent: line.gstPercent, lineTax: line.tax })),
      `invoice line GST for order #${scenario.id}`
    );
  }
});
