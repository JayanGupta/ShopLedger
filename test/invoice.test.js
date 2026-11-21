'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function order(id, items, coupon) {
  return { id, items, coupon: coupon || '' };
}

function figuresFor(sample) {
  return {
    invoice: invoice.computeInvoiceFigures(sample),
    checkout: pricing.computeTotals(sample.items, sample.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 18% and 5% GST rates with no coupon', function () {
  const sample = order(1001, [
    { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2, gstRate: 18 },
    { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2, gstRate: 5 }
  ]);
  const { invoice: actual, checkout } = figuresFor(sample);

  assert.deepEqual({ subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 });
  assert.deepEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [[18, 50.4], [5, 16.5]]);
  assert.deepEqual({ subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 });
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 discount and GST match checkout totals', function () {
  const sample = order(1002, [
    { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1, gstRate: 5 },
    { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2, gstRate: 5 }
  ], 'SAVE10');
  const { invoice: actual, checkout } = figuresFor(sample);

  assert.deepEqual({ subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 });
  assert.deepEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 28.8], [5, 17.1]]);
  assert.deepEqual({ subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 maximum discount is capped at ₹150 before GST', function () {
  const sample = order(1004, [
    { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2, gstRate: 5 }
  ], 'SAVE10');
  const { invoice: actual, checkout } = figuresFor(sample);

  assert.deepEqual({ subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
  assert.deepEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 104.5]]);
  assert.deepEqual({ subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 all-18% lines with no coupon agree on invoice and checkout totals', function () {
  const sample = order(1008, [
    { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1, gstRate: 18 },
    { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2, gstRate: 18 }
  ]);
  const { invoice: actual, checkout } = figuresFor(sample);

  assert.deepEqual({ subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 });
  assert.deepEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [[18, 25.2], [18, 64.8]]);
  assert.deepEqual({ subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 });
});

test('FIXED BEHAVIOUR: invoice matches checkout HSN GST and capped discount before tax', function () {
  const sample = order(1004, [
    { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
  ], 'SAVE10');
  const { invoice: actual, checkout } = figuresFor(sample);

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total }
  );
  assert.deepEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 104.5]]);
});
