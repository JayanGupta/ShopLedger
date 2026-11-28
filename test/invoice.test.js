var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(id, name, hsn, price, qty) {
  return { id: id, name: name, sku: 'SKU-' + id, hsn: hsn, price: price, qty: qty };
}

function checkout(items, coupon) {
  return pricing.computeTotals(items, coupon || '');
}

test('invoice matches checkout figures for HSN GST and capped SAVE10 discount', function () {
  var items = [
    line(1, 'Rice', '1006', 640, 1),
    line(4, 'Sunflower Oil', '1512', 190, 2)
  ];

  assert.deepEqual(invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' }), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower Oil', sku: 'SKU-4', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
});

test('invoice uses HSN GST and applies SAVE10 before tax for #1002', function () {
  var items = [
    line(1, 'Rice', '1006', 640, 1),
    line(4, 'Sunflower Oil', '1512', 190, 2)
  ];
  var figures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });
  var billed = checkout(items, 'SAVE10');

  assert.deepEqual(figures, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower Oil', sku: 'SKU-4', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.deepEqual({ tax: billed.tax, total: billed.total }, { tax: 45.9, total: 963.9 });
});

test('invoice respects the SAVE10 150 cap for #1004', function () {
  var items = [line(5, 'Groundnut Oil', '1508', 1120, 2)];
  var figures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });
  var billed = checkout(items, 'SAVE10');

  assert.deepEqual({ discount: figures.discount, tax: figures.tax, total: figures.total },
    { discount: 150, tax: 104.5, total: 2194.5 });
  assert.deepEqual({ discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 150, tax: 104.5, total: 2194.5 });
});

test('invoice uses the correct 5% and 12% HSN slabs without a coupon (#1001 and #1007)', function () {
  var order1001 = [line(8, 'Tea', '0902', 140, 2), line(2, 'Toor Dal', '0713', 165, 2)];
  var order1007 = [line(6, 'Ghee', '0405', 450, 2), line(4, 'Sunflower Oil', '1512', 190, 2)];

  assert.deepEqual(invoice.computeInvoiceFigures({ items: order1001, coupon: '' }), {
    subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
    rows: [
      { name: 'Tea', sku: 'SKU-8', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Toor Dal', sku: 'SKU-2', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.deepEqual({ tax: checkout(order1001).tax, total: checkout(order1001).total }, { tax: 66.9, total: 676.9 });
  assert.deepEqual({ tax: invoice.computeInvoiceFigures({ items: order1007 }).tax, total: invoice.computeInvoiceFigures({ items: order1007 }).total }, { tax: 127, total: 1407 });
  assert.deepEqual({ tax: checkout(order1007).tax, total: checkout(order1007).total }, { tax: 127, total: 1407 });
});

test('invoice matches checkout when every item uses the 18% slab (#1008)', function () {
  var items = [line(8, 'Tea', '0902', 140, 1), line(12, 'Kokum Sherbet', '2106', 180, 2)];
  var figures = invoice.computeInvoiceFigures({ items: items, coupon: '' });
  var billed = checkout(items);

  assert.deepEqual({ subtotal: figures.subtotal, discount: figures.discount, tax: figures.tax, total: figures.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 });
  assert.deepEqual({ subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 });
});
