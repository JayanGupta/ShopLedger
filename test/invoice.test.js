var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

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

var invoice1001 = {
  id: 1001,
  coupon: '',
  items: [
    { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140, qty: 2 },
    { id: 2, sku: 'GRN-002', name: 'Unpolished Toor Dal 1kg', hsn: '0713', price: 165, qty: 2 }
  ]
};

var invoice1003 = {
  id: 1003,
  coupon: 'FLAT50',
  items: [
    { id: 7, sku: 'DRY-002', name: 'Pasteurized Table Butter 500g', hsn: '0405', price: 260, qty: 1 },
    { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140, qty: 1 }
  ]
};

var invoice1008 = {
  id: 1008,
  coupon: '',
  items: [
    { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140, qty: 1 },
    { id: 12, sku: 'BEV-003', name: 'Kokum Sherbet Concentrate 750ml', hsn: '2106', price: 180, qty: 2 }
  ]
};

function assertMatchesCheckout(order, figures) {
  var checkout = pricing.computeTotals(order.items, order.coupon);

  ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'].forEach(function (key) {
    assert.equal(figures[key], checkout[key], key + ' matches checkout');
  });
}

test('invoice #1002 uses its 5% HSN GST rate and discounts before tax', function () {
  var figures = invoice.computeInvoiceFigures(invoice1002);

  assert.equal(figures.subtotal, 1020);
  assert.equal(figures.discount, 102);
  assert.equal(figures.tax, 45.9);
  assert.equal(figures.total, 963.9);
  assertMatchesCheckout(invoice1002, figures);
});

test('invoice #1004 applies the SAVE10 maximum discount', function () {
  var figures = invoice.computeInvoiceFigures(invoice1004);

  assert.equal(figures.discount, 150);
  assert.equal(figures.tax, 104.5);
  assert.equal(figures.total, 2194.5);
  assertMatchesCheckout(invoice1004, figures);
});

test('invoice #1001 preserves mixed GST rates without a coupon', function () {
  var figures = invoice.computeInvoiceFigures(invoice1001);

  assert.equal(figures.subtotal, 610);
  assert.equal(figures.discount, 0);
  assert.equal(figures.tax, 66.9);
  assert.equal(figures.total, 676.9);
  assertMatchesCheckout(invoice1001, figures);
});

test('invoice #1003 applies FLAT50 before mixed-rate GST', function () {
  var figures = invoice.computeInvoiceFigures(invoice1003);

  assert.equal(figures.subtotal, 400);
  assert.equal(figures.discount, 50);
  assert.equal(figures.tax, 49.35);
  assert.equal(figures.total, 399.35);
  assertMatchesCheckout(invoice1003, figures);
});

test('invoice #1008 remains a no-coupon control', function () {
  var figures = invoice.computeInvoiceFigures(invoice1008);

  assert.equal(figures.subtotal, 500);
  assert.equal(figures.discount, 0);
  assert.equal(figures.tax, 90);
  assert.equal(figures.total, 590);
  assertMatchesCheckout(invoice1008, figures);
});
