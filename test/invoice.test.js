const test = require('node:test');
const assert = require('node:assert').strict;
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function assertOrder(order, expectedBill, expectedInvoice, expectedRowTaxes) {
  const bill = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(amounts(bill), expectedBill, 'checkout amounts');
  assert.deepEqual(amounts(printed), expectedInvoice, 'invoice amounts');
  assert.deepEqual(
    printed.rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })),
    expectedRowTaxes,
    'printed GST by item'
  );
}

// An HSN without gstRate models the lines saved by checkout.
test('#1001 prints the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Dal', price: 165, qty: 2, hsn: '0713' },
      { name: 'Butter', price: 260, qty: 1, hsn: '0405' }
    ]
  };
  const expected = { subtotal: 590, discount: 0, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70 };
  assertOrder(order, expected, expected, [
    { hsn: '0713', gstPercent: 5, lineTax: 16.50 },
    { hsn: '0405', gstPercent: 12, lineTax: 31.20 }
  ]);
});

test('#1002 applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  };
  const expected = { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 };
  assertOrder(order, expected, expected, [
    { hsn: '1006', gstPercent: 5, lineTax: 28.80 },
    { hsn: '1512', gstPercent: 5, lineTax: 17.10 }
  ]);
});

test('#1004 caps SAVE10 at ₹150 before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };
  const expected = { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 };
  assertOrder(order, expected, expected, [
    { hsn: '1508', gstPercent: 5, lineTax: 104.50 }
  ]);
});

test('#1008 invoice matches checkout at 18% without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Sherbet', price: 180, qty: 2, hsn: '2106' }
    ]
  };
  const expected = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  assertOrder(order, expected, expected, [
    { hsn: '0902', gstPercent: 18, lineTax: 25.20 },
    { hsn: '2106', gstPercent: 18, lineTax: 64.80 }
  ]);
});

test('invoice matches checkout when a capped coupon spans two GST slabs', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1000, qty: 1, hsn: '0405' }
    ]
  };
  // Each ₹1,000 line receives ₹75 of the capped discount before GST.
  const expected = { subtotal: 2000, discount: 150, tax: 157.25, cgst: 78.63, sgst: 78.62, total: 2007.25 };
  assertOrder(order, expected, expected, [
    { hsn: '1006', gstPercent: 5, lineTax: 46.25 },
    { hsn: '0405', gstPercent: 12, lineTax: 111 }
  ]);
});
