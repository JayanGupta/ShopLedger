const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const config = require('../config');

function compare(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    ...invoiceTotals,
    gstByLine: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
  }, expectedInvoice);
  assert.deepEqual({
    ...checkoutTotals,
    gstByLine: lines.map(({ gstPercent, tax }) => [gstPercent, tax]),
  }, expectedCheckout);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  // Omit gstRate to model order lines that store only the HSN.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Toor dal', price: 165, qty: 2, hsn: '0713' },
      { name: 'Ghee', price: 280, qty: 1, hsn: '0405' },
    ],
  };

  const expected = {
    subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1,
    gstByLine: [[5, 16.5], [12, 33.6]],
  };
  compare(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' },
    ],
  };

  const expected = {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
    gstByLine: [[5, 28.8], [5, 17.1]],
  };
  compare(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap on ₹2,240', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 560, qty: 4, hsn: '1006' }],
  };

  const expected = {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    gstByLine: [[5, 104.5]],
  };
  compare(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree at 18% without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 220, qty: 1, hsn: '0901', gstRate: 18 },
    ],
  };

  const expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    gstByLine: [[18, 50.4], [18, 39.6]],
  };
  compare(order, expected, expected);
});

test('invoice matches checkout for mixed GST slabs with a capped coupon', () => {
  const items = [
    { name: 'Rice', price: 1120, qty: 1, hsn: '1006' },
    { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65,
    gstByLine: [[5, 52.25], [12, 125.4]],
  };

  const order = {
    items, coupon, subtotal: checkout.subtotal, discount: checkout.discount,
    tax: checkout.tax, total: checkout.total,
  };
  compare(order, expected, expected);

  const originalCoupon = config.coupons.SAVE10;
  const billedFigures = invoice.computeInvoiceFigures(order);
  try {
    config.coupons.SAVE10 = { ...originalCoupon, active: false };
    assert.deepEqual(invoice.computeInvoiceFigures(order), billedFigures);
  } finally {
    config.coupons.SAVE10 = originalCoupon;
  }
});
