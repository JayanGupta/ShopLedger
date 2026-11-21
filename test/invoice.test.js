'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, hsn, price, qty, gstRate) {
  return { name, sku: name.toUpperCase().replace(/\s+/g, '-'), hsn, price, qty, gstRate };
}

function order(id, items, coupon) {
  return { id, items, coupon: coupon || '' };
}

function assertCheckout(actual, expected) {
  assert.deepEqual({
    subtotal: actual.subtotal,
    discount: actual.discount,
    tax: actual.tax,
    cgst: actual.cgst,
    sgst: actual.sgst,
    total: actual.total
  }, expected);
}

test('CURRENT BEHAVIOUR: order #1001 uses 5% and 12% item rates without a coupon', function () {
  const items = [
    item('Toor Dal', '0713', 165, 2, 5),
    item('Ghee', '0405', 450, 1, 12)
  ];
  const actual = invoice.computeInvoiceFigures(order(1001, items, ''));
  const checkout = pricing.computeTotals(items, '');

  assert.deepEqual(actual, {
    subtotal: 780,
    discount: 0,
    tax: 70.5,
    cgst: 35.25,
    sgst: 35.25,
    total: 850.5,
    rows: [
      { name: 'Toor Dal', sku: 'TOOR-DAL', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assertCheckout(checkout, { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 });
});

test('CURRENT BEHAVIOUR: order #1002 applies SAVE10 before GST and matches checkout', function () {
  const items = [
    item('Rice', '1006', 640, 1, 5),
    item('Packaged Tea', '0902', 140, 1, 18)
  ];
  const actual = invoice.computeInvoiceFigures(order(1002, items, 'SAVE10'));
  const checkout = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(actual, {
    subtotal: 780,
    discount: 78,
    tax: 51.48,
    cgst: 25.74,
    sgst: 25.74,
    total: 753.48,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Packaged Tea', sku: 'PACKAGED-TEA', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 22.68 }
    ]
  });
  assertCheckout(checkout, { subtotal: 780, discount: 78, tax: 51.48, cgst: 25.74, sgst: 25.74, total: 753.48 });
});

test('CURRENT BEHAVIOUR: order #1004 resolves HSN 1508 and caps SAVE10 at ₹150', function () {
  const items = [item('Groundnut Oil', '1508', 1120, 2, undefined)];
  const actual = invoice.computeInvoiceFigures(order(1004, items, 'SAVE10'));
  const checkout = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(actual, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: 'GROUNDNUT-OIL', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assertCheckout(checkout, { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: order #1008 with all 18% items and no coupon matches checkout', function () {
  const items = [
    item('Packaged Tea', '0902', 140, 1, 18),
    item('Kokum Concentrate', '2106', 180, 2, 18)
  ];
  const actual = invoice.computeInvoiceFigures(order(1008, items, ''));
  const checkout = pricing.computeTotals(items, '');

  assert.deepEqual(actual, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Packaged Tea', sku: 'PACKAGED-TEA', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Concentrate', sku: 'KOKUM-CONCENTRATE', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assertCheckout(checkout, { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 });
});
