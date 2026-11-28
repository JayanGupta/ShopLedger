const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceAmounts } = invoice.computeInvoiceFigures(order);
  const { lines, taxable, ...checkoutAmounts } = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(
    { ...invoiceAmounts, gstByLine: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]) },
    expectedInvoice
  );
  assert.deepEqual(
    { ...checkoutAmounts, gstByLine: lines.map(({ gstPercent, tax }) => [gstPercent, tax]) },
    expectedCheckout
  );
}

// Omit gstRate on the mixed-slab lines to model snapshots carrying only HSN.
test('CURRENT BEHAVIOUR: #1001-style invoice falls back to 18% for mixed HSN slabs', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' },
    ],
  };

  assertFigures(order, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    gstByLine: [[18, 36], [18, 54]],
  }, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    gstByLine: [[5, 10], [12, 36]],
  });
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 changes the GST and discount but the total matches', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: 18 }],
  };

  assertFigures(order, {
    subtotal: 600, discount: 70.8, tax: 108, cgst: 54, sgst: 54, total: 637.2,
    gstByLine: [[18, 108]],
  }, {
    subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2,
    gstByLine: [[18, 97.2]],
  });
});

test('CURRENT BEHAVIOUR: #1004-style SAVE10 invoice ignores the 150 rupee cap', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 560, qty: 4, hsn: '0902' }],
  };

  assertFigures(order, {
    subtotal: 2240, discount: 264.32, tax: 403.2, cgst: 201.6, sgst: 201.6, total: 2378.88,
    gstByLine: [[18, 403.2]],
  }, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    gstByLine: [[18, 376.2]],
  });
});

test('CURRENT BEHAVIOUR: #1008-style all-18% order without a coupon matches checkout', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 150, qty: 1, hsn: '0901' },
    ],
  };
  const expected = {
    subtotal: 350, discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413,
    gstByLine: [[18, 36], [18, 27]],
  };

  assertFigures(order, expected, expected);
});
