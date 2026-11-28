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

test('invoice matches checkout for mixed HSN slabs with a capped SAVE10 discount', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' },
    ],
  };
  const expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65,
    gstByLine: [[5, 52.25], [12, 125.4]],
  };

  assertFigures(order, expected, expected);

  const reprint = invoice.computeInvoiceFigures({
    ...order,
    coupon: 'RETIRED-SAVE10',
    discount: expected.discount,
  });
  const { rows, ...amounts } = reprint;
  assert.deepEqual(
    { ...amounts, gstByLine: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]) },
    expected
  );
});

// Omit gstRate on the mixed-slab lines to model snapshots carrying only HSN.
test('#1001-style invoice uses each line’s HSN slab', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' },
    ],
  };

  const expected = {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    gstByLine: [[5, 10], [12, 36]],
  };
  assertFigures(order, expected, expected);
});

test('#1002-style invoice applies SAVE10 before calculating GST', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: 18 }],
  };

  const expected = {
    subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2,
    gstByLine: [[18, 97.2]],
  };
  assertFigures(order, expected, expected);
});

test('#1004-style invoice honors the 150 rupee SAVE10 cap', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 560, qty: 4, hsn: '0902' }],
  };

  const expected = {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    gstByLine: [[18, 376.2]],
  };
  assertFigures(order, expected, expected);
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
