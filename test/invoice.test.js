'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, hsn, gstRate, price, qty) {
  return { name, sku, hsn, gstRate, price, qty };
}

function order(id, items, coupon) {
  return { id, items, coupon };
}

test('CURRENT BEHAVIOUR: #1001 invoice figures for 5% and 12% items without a coupon', () => {
  const o = order(1001, [
    item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 18, 140, 2),
    item('Unpolished Toor Dal 1kg', 'GRN-002', '0713', 5, 165, 2)
  ], '');
  const actual = invoice.computeInvoiceFigures(o);
  const billed = pricing.computeTotals(o.items, o.coupon);

  assert.deepEqual(actual, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.equal(billed.tax, 66.9);
  assert.equal(billed.total, 676.9);
});

test('CURRENT BEHAVIOUR: #1002 invoice matches checkout pre-tax SAVE10 figures', () => {
  const o = order(1002, [
    item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 5, 640, 1),
    item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 5, 190, 2)
  ], 'SAVE10');
  const actual = invoice.computeInvoiceFigures(o);
  const billed = pricing.computeTotals(o.items, o.coupon);

  assert.deepEqual(actual, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.equal(billed.discount, 102);
  assert.equal(billed.tax, 45.9);
  assert.equal(billed.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 discount is capped before GST on ₹2,240', () => {
  const o = order(1004, [
    item('Groundnut oil (in-memory fixture)', 'OIL-002', '1508', 5, 2240, 1)
  ], 'SAVE10');
  const actual = invoice.computeInvoiceFigures(o);
  const billed = pricing.computeTotals(o.items, o.coupon);

  assert.deepEqual(actual, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut oil (in-memory fixture)', sku: 'OIL-002', hsn: '1508', qty: 1, price: 2240, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 104.5);
  assert.equal(billed.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice figures for all 18% items without a coupon', () => {
  const o = order(1008, [
    item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 18, 140, 2),
    item('Filter Coffee Decoction Blend 500g', 'BEV-002', '0901', 18, 310, 1)
  ], '');
  const actual = invoice.computeInvoiceFigures(o);
  const billed = pricing.computeTotals(o.items, o.coupon);

  assert.deepEqual(actual, {
    subtotal: 590,
    discount: 0,
    tax: 106.2,
    cgst: 53.1,
    sgst: 53.1,
    total: 696.2,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Filter Coffee Decoction Blend 500g', sku: 'BEV-002', hsn: '0901', qty: 1, price: 310, gstPercent: 18, line: 310, lineTax: 55.8 }
    ]
  });
  assert.equal(billed.tax, 106.2);
  assert.equal(billed.total, 696.2);
});

test('invoice matches checkout HSN GST and capped pre-tax coupon figures', () => {
  const o = order(1002, [
    item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', undefined, 640, 1),
    item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', undefined, 190, 2)
  ], 'SAVE10');
  const actual = invoice.computeInvoiceFigures(o);
  const billed = pricing.computeTotals(o.items, o.coupon);

  assert.deepEqual({
    subtotal: actual.subtotal,
    discount: actual.discount,
    tax: actual.tax,
    cgst: actual.cgst,
    sgst: actual.sgst,
    total: actual.total
  }, {
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total
  });
  assert.equal(actual.discount, 102);
  assert.equal(actual.tax, 45.9);
  assert.equal(actual.total, 963.9);
  assert.deepEqual(actual.rows.map(row => [row.hsn, row.gstPercent, row.lineTax]), [
    ['1006', 5, 28.8],
    ['1512', 5, 17.1]
  ]);
});
