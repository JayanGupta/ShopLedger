'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// New order lines carry HSN but do not carry gstRate; both calculators receive
// the same in-memory line items, as they would for a saved order.
function calculate(items, coupon = '') {
  return {
    invoice: invoice.computeInvoiceFigures({ items, coupon }),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('mixed 5% and 12% HSN items use their checkout slabs', () => {
  const items = [
    { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006' },
    { id: 2, name: 'Ghee', sku: 'GHEE', price: 450, qty: 1, hsn: '0405' }
  ];
  const result = calculate(items);
  assert.deepEqual(result.invoice, {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepEqual(result.checkout.lines.map(line => line.gstPercent), [5, 12]);
  assert.equal(result.checkout.tax, 86);
  assert.equal(result.checkout.total, 1176);
});

test('SAVE10 invoice applies discount before tax', () => {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006' }];
  const result = calculate(items, 'SAVE10');
  assert.deepEqual(result.invoice, {
    subtotal: 640, discount: 64, tax: 28.8, cgst: 14.4, sgst: 14.4, total: 604.8,
    rows: [{ name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 }]
  });
  assert.equal(result.checkout.discount, 64);
  assert.equal(result.checkout.tax, 28.8);
  assert.equal(result.checkout.total, 604.8);
});

test('SAVE10 invoice applies the cap on a ₹2,240 subtotal', () => {
  const items = [{ id: 2, name: 'Oil', sku: 'OIL', price: 1120, qty: 2, hsn: '1508' }];
  const result = calculate(items, 'SAVE10');
  assert.deepEqual(result.invoice, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [{ name: 'Oil', sku: 'OIL', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }]
  });
  assert.equal(result.checkout.discount, 150);
  assert.equal(result.checkout.tax, 104.5);
  assert.equal(result.checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: 18% HSN item without coupon matches checkout', () => {
  const items = [{ id: 3, name: 'Tea', sku: 'TEA', price: 250, qty: 2, hsn: '0902' }];
  const result = calculate(items);
  assert.deepEqual(result.invoice, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    rows: [{ name: 'Tea', sku: 'TEA', hsn: '0902', qty: 2, price: 250, gstPercent: 18, line: 500, lineTax: 90 }]
  });
  assert.equal(result.checkout.tax, 90);
  assert.equal(result.checkout.total, 590);
});

test('invoice matches checkout for mixed GST slabs with a capped coupon', () => {
  const items = [
    { id: 1, name: 'Rice', sku: 'RICE', price: 1120, qty: 1, hsn: '1006' },
    { id: 2, name: 'Ghee', sku: 'GHEE', price: 1120, qty: 1, hsn: '0405' }
  ];
  const result = calculate(items, 'SAVE10');
  assert.equal(result.checkout.discount, 150);
  assert.equal(result.invoice.subtotal, result.checkout.subtotal);
  assert.equal(result.invoice.discount, result.checkout.discount);
  assert.equal(result.invoice.tax, result.checkout.tax);
  assert.equal(result.invoice.cgst, result.checkout.cgst);
  assert.equal(result.invoice.sgst, result.checkout.sgst);
  assert.equal(result.invoice.total, result.checkout.total);
  assert.deepEqual(result.invoice.rows.map(row => [row.gstPercent, row.lineTax]),
    result.checkout.lines.map(line => [line.gstPercent, line.tax]));

  const config = require('../config');
  const savedOrder = { items, coupon: 'SAVE10', ...result.checkout };
  const wasActive = config.coupons.SAVE10.active;
  try {
    config.coupons.SAVE10.active = false;
    assert.deepEqual(invoice.computeInvoiceFigures(savedOrder), result.invoice);
  } finally {
    config.coupons.SAVE10.active = wasActive;
  }
});
