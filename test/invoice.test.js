const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These fixtures model saved order lines and leave the optional gstRate unset.
const cases = [
  {
    name: '#1001 invoice uses 18% for 5% and 12% items',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', price: 90, qty: 1, hsn: '1006' },
        { name: 'Ghee', price: 260, qty: 2, hsn: '0405' }
      ]
    },
    invoiceTotals: { subtotal: 610, discount: 0, tax: 109.8, cgst: 54.9, sgst: 54.9, total: 719.8 },
    invoiceRows: [
      { gstPercent: 18, line: 90, lineTax: 16.2 },
      { gstPercent: 18, line: 520, lineTax: 93.6 }
    ],
    checkoutTotals: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 },
    checkoutRates: [5, 12]
  },
  {
    name: '#1002 invoice applies SAVE10 after GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
        { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
      ]
    },
    invoiceTotals: { subtotal: 1020, discount: 120.36, tax: 183.6, cgst: 91.8, sgst: 91.8, total: 1083.24 },
    invoiceRows: [
      { gstPercent: 18, line: 640, lineTax: 115.2 },
      { gstPercent: 18, line: 380, lineTax: 68.4 }
    ],
    checkoutTotals: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutRates: [5, 5]
  },
  {
    name: '#1004 invoice ignores the SAVE10 cap on a 2240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 640, qty: 3, hsn: '1006' },
        { name: 'Pulses', price: 160, qty: 2, hsn: '0713' }
      ]
    },
    invoiceTotals: { subtotal: 2240, discount: 264.32, tax: 403.2, cgst: 201.6, sgst: 201.6, total: 2378.88 },
    invoiceRows: [
      { gstPercent: 18, line: 1920, lineTax: 345.6 },
      { gstPercent: 18, line: 320, lineTax: 57.6 }
    ],
    checkoutTotals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutRates: [5, 5]
  },
  {
    name: '#1008 invoice matches checkout for 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', price: 250, qty: 2, hsn: '0902' },
        { name: 'Coffee', price: 150, qty: 1, hsn: '0901' }
      ]
    },
    invoiceTotals: { subtotal: 650, discount: 0, tax: 117, cgst: 58.5, sgst: 58.5, total: 767 },
    invoiceRows: [
      { gstPercent: 18, line: 500, lineTax: 90 },
      { gstPercent: 18, line: 150, lineTax: 27 }
    ],
    checkoutTotals: { subtotal: 650, discount: 0, tax: 117, cgst: 58.5, sgst: 58.5, total: 767 },
    checkoutRates: [18, 18]
  }
];

function billedFigures({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

for (const scenario of cases) {
  test('CURRENT BEHAVIOUR: ' + scenario.name, function () {
    const order = scenario.order;
    const figures = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(billedFigures(figures), scenario.invoiceTotals);
    assert.deepEqual(
      figures.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax })),
      scenario.invoiceRows
    );
    assert.deepEqual(billedFigures(checkout), scenario.checkoutTotals);
    assert.deepEqual(checkout.lines.map((line) => line.gstPercent), scenario.checkoutRates);
  });
}
