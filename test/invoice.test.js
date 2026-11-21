'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice for 5% and 12% items without a coupon',
    coupon: '',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 100, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', sku: 'DAI-001', price: 100, qty: 1, hsn: '0405', gstRate: 12 }
    ],
    expectedInvoice: {
      subtotal: 200, discount: 0, tax: 17, cgst: 8.5, sgst: 8.5, total: 217,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 100, gstPercent: 5, line: 100, lineTax: 5 },
        { name: 'Ghee', sku: 'DAI-001', hsn: '0405', qty: 1, price: 100, gstPercent: 12, line: 100, lineTax: 12 }
      ]
    },
    expectedBilled: { subtotal: 200, discount: 0, tax: 17, total: 217 }
  },
  {
    name: 'CORRECT BEHAVIOUR: #1002 SAVE10 invoice uses checkout discount and discounted GST on 5% items',
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Sunflower oil', sku: 'OIL-001', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ],
    expectedInvoice: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Sunflower oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    expectedBilled: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  },
  {
    name: 'CORRECT BEHAVIOUR: #1004 SAVE10 invoice applies the ₹150 discount cap before GST',
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 1000, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Tea', sku: 'BEV-001', price: 1240, qty: 1, hsn: '0902', gstRate: 18 }
    ],
    expectedInvoice: {
      subtotal: 2240, discount: 150, tax: 254.9, cgst: 127.45, sgst: 127.45, total: 2344.9,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 46.65 },
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 1240, gstPercent: 18, line: 1240, lineTax: 208.25 }
      ]
    },
    expectedBilled: { subtotal: 2240, discount: 150, tax: 254.9, total: 2344.9 }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 invoice for all-18% items without a coupon',
    coupon: '',
    items: [
      { name: 'Tea', sku: 'BEV-001', price: 800, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Coffee', sku: 'BEV-002', price: 1200, qty: 1, hsn: '0901', gstRate: 18 }
    ],
    expectedInvoice: {
      subtotal: 2000, discount: 0, tax: 360, cgst: 180, sgst: 180, total: 2360,
      rows: [
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 800, gstPercent: 18, line: 800, lineTax: 144 },
        { name: 'Coffee', sku: 'BEV-002', hsn: '0901', qty: 1, price: 1200, gstPercent: 18, line: 1200, lineTax: 216 }
      ]
    },
    expectedBilled: { subtotal: 2000, discount: 0, tax: 360, total: 2360 }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const order = { items: scenario.items, coupon: scenario.coupon };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const billedFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual(invoiceFigures, scenario.expectedInvoice);
    assert.deepEqual({
      subtotal: billedFigures.subtotal,
      discount: billedFigures.discount,
      tax: billedFigures.tax,
      total: billedFigures.total
    }, scenario.expectedBilled);
  });
}

test('invoice matches checkout totals and per-line GST for representative orders', () => {
  for (const scenario of cases) {
    const items = scenario.items.map(function (item) {
      return {
        name: item.name,
        sku: item.sku,
        price: item.price,
        qty: item.qty,
        hsn: item.hsn
      };
    });
    const invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: scenario.coupon });
    const billedFigures = pricing.computeTotals(items, scenario.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rows: invoiceFigures.rows.map(function (row) {
        return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
      })
    }, {
      subtotal: billedFigures.subtotal,
      discount: billedFigures.discount,
      tax: billedFigures.tax,
      cgst: billedFigures.cgst,
      sgst: billedFigures.sgst,
      total: billedFigures.total,
      rows: billedFigures.lines.map(function (line) {
        return { hsn: line.hsn, gstPercent: line.gstPercent, line: line.gross, lineTax: line.tax };
      })
    }, scenario.name);
  }
});
