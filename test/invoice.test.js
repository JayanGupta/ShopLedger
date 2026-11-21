var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');

var invoice1002 = {
  id: 1002,
  coupon: 'SAVE10',
  items: [
    { id: 1, sku: 'GRN-001', name: 'Indrayani Basmati Rice 5kg', hsn: '1006', price: 640, qty: 1 },
    { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', price: 190, qty: 2 }
  ]
};

var invoice1004 = {
  id: 1004,
  coupon: 'SAVE10',
  items: [
    { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', price: 1120, qty: 2 }
  ]
};

test('invoice #1002 uses its 5% HSN GST rate and discounts before tax', function () {
  var figures = invoice.computeInvoiceFigures(invoice1002);

  assert.equal(figures.subtotal, 1020);
  assert.equal(figures.discount, 102);
  assert.equal(figures.tax, 45.9);
  assert.equal(figures.total, 963.9);
});

test('invoice #1004 applies the SAVE10 maximum discount', function () {
  var figures = invoice.computeInvoiceFigures(invoice1004);

  assert.equal(figures.discount, 150);
  assert.equal(figures.tax, 104.5);
  assert.equal(figures.total, 2194.5);
});
