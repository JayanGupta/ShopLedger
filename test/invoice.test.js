'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function makeOrder(id, items, coupon) {
  const code = coupon || '';
  const totals = pricing.computeTotals(items, code);
  return {
    id: id,
    items: items,
    coupon: code,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('CHECKOUT BEHAVIOUR #1001 keeps the 18% and 5% HSN slabs', function () {
  const order = makeOrder(1001, [
    { name: 'Tea', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2 },
    { name: 'Toor Dal', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2 }
  ]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 610);
  assert.equal(figures.tax, 66.9);
  assert.equal(figures.discount, 0);
  assert.equal(figures.total, 676.9);
});

test('CHECKOUT BEHAVIOUR #1002 applies SAVE10 before GST', function () {
  const order = makeOrder(1002, [
    { name: 'Rice', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
    { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
  ], 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 1020);
  assert.equal(figures.tax, 45.9);
  assert.equal(figures.discount, 102);
  assert.equal(figures.total, 963.9);
});

test('CHECKOUT BEHAVIOUR #1004 respects the SAVE10 discount cap', function () {
  const order = makeOrder(1004, [
    { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
  ], 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 2240);
  assert.equal(figures.tax, 104.5);
  assert.equal(figures.discount, 150);
  assert.equal(figures.total, 2194.5);
});

test('CURRENT BEHAVIOUR #1008 matches for two 18% HSN items without a coupon', function () {
  const order = makeOrder(1008, [
    { name: 'Tea', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1 },
    { name: 'Sherbet', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2 }
  ]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 500);
  assert.equal(figures.tax, 90);
  assert.equal(figures.discount, 0);
  assert.equal(figures.total, 590);
});

test('CORRECT BEHAVIOUR #1002 allocates SAVE10 before tax at each HSN rate', function () {
  const order = makeOrder(1002, [
    { name: 'Rice', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
    { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
  ], 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 5, lineTax: 28.8 },
    { gstPercent: 5, lineTax: 17.1 }
  ]);
});

