'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These are isolated order snapshots, not fixtures loaded from data/db.json.
// gstRate is expressed as a percentage because invoice.js reads that field.
function line(name, sku, hsn, gstRate, price, qty) {
  return { name, sku, hsn, gstRate, price, qty };
}

function inMemoryOrder(id, items, coupon) {
  return { id, items, coupon: coupon || '' };
}

function assertInvoiceFigures(actual, expected) {
  for (const field of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
    assert.equal(actual[field], expected[field], field);
  }
  assert.deepEqual(actual.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax })), expected.rows);
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% lines without coupon', () => {
  const items = [
    line('Rice', 'RICE-01', '1006', 5, 100, 1),
    line('Ghee', 'GHEE-01', '0405', 12, 250, 1)
  ];
  const order = inMemoryOrder(1001, items, '');
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, order.coupon);

  assertInvoiceFigures(invoiceFigures, {
    subtotal: 350, discount: 0, tax: 35, cgst: 17.5, sgst: 17.5, total: 385,
    rows: [{ gstPercent: 5, line: 100, lineTax: 5 }, { gstPercent: 12, line: 250, lineTax: 30 }]
  });
  assert.equal(checkoutFigures.total, 385);
  assert.equal(checkoutFigures.tax, 35);
});

test('invoice applies #1002 SAVE10 to subtotal before GST', () => {
  const items = [line('Packaged Tea', 'TEA-01', '0902', 18, 1000, 1)];
  const order = inMemoryOrder(1002, items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, order.coupon);

  assertInvoiceFigures(invoiceFigures, {
    subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062,
    rows: [{ gstPercent: 18, line: 1000, lineTax: 162 }]
  });
  assert.equal(checkoutFigures.discount, 100);
  assert.equal(checkoutFigures.tax, 162);
  assert.equal(checkoutFigures.total, 1062);
});

test('invoice matches #1004 mixed-rate checkout and respects SAVE10 ₹150 cap', () => {
  const items = [
    line('Rice', 'RICE-02', '1006', 5, 1000, 1),
    line('Spices', 'SPICE-01', '0904', 12, 1240, 1)
  ];
  const order = inMemoryOrder(1004, items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, order.coupon);

  assertInvoiceFigures(invoiceFigures, {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49,
    rows: [{ gstPercent: 5, line: 1000, lineTax: 46.65 }, { gstPercent: 12, line: 1240, lineTax: 138.84 }]
  });
  assert.equal(checkoutFigures.discount, 150);
  assert.equal(checkoutFigures.tax, 185.49);
  assert.equal(checkoutFigures.total, 2275.49);
});

test('CURRENT BEHAVIOUR: #1008 all 18% lines without coupon', () => {
  const items = [
    line('Coffee', 'COFFEE-01', '0901', 18, 100, 1),
    line('Syrup', 'SYRUP-01', '2106', 18, 50, 2)
  ];
  const order = inMemoryOrder(1008, items, '');
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, order.coupon);

  assertInvoiceFigures(invoiceFigures, {
    subtotal: 200, discount: 0, tax: 36, cgst: 18, sgst: 18, total: 236,
    rows: [{ gstPercent: 18, line: 100, lineTax: 18 }, { gstPercent: 18, line: 100, lineTax: 18 }]
  });
  assert.equal(checkoutFigures.total, 236);
  assert.equal(checkoutFigures.tax, 36);
});

test('invoice figures match checkout for #1004 HSN slab and capped SAVE10', () => {
  const items = [
    line('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', undefined, 1120, 2)
  ];
  const order = inMemoryOrder(1004, items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, order.coupon);

  assertInvoiceFigures(invoiceFigures, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [{ gstPercent: 5, line: 2240, lineTax: 104.5 }]
  });
  assert.equal(invoiceFigures.subtotal, checkoutFigures.subtotal);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});
