var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function assertInvoiceMatchesCheckout(order) {
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutTotals = pricing.computeTotals(order.items, order.coupon);

  assert.equal(invoiceFigures.subtotal, checkoutTotals.subtotal);
  assert.equal(invoiceFigures.discount, checkoutTotals.discount);
  assert.equal(invoiceFigures.tax, checkoutTotals.tax);
  assert.equal(invoiceFigures.total, checkoutTotals.total);
}

test('invoice uses checkout HSN GST rates for mixed-rate orders', function () {
  var order = {
    coupon: '',
    items: [
      { sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 140, qty: 2 },
      { sku: 'GRN-002', name: 'Dal', hsn: '0713', price: 165, qty: 2 }
    ]
  };

  var figures = invoice.computeInvoiceFigures(order);
  assertInvoiceMatchesCheckout(order);
  assert.equal(figures.total, 676.9);
  assert.deepEqual(figures.rows.map(function (row) { return row.gstPercent; }), [18, 5]);
});

test('invoice applies SAVE10 before tax using the same checkout calculation', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { sku: 'OIL-001', name: 'Sunflower Oil', hsn: '1512', price: 190, qty: 2 }
    ]
  };

  var figures = invoice.computeInvoiceFigures(order);
  assertInvoiceMatchesCheckout(order);
  assert.deepEqual(
    { discount: figures.discount, tax: figures.tax, total: figures.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('invoice honours the SAVE10 discount cap', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { sku: 'OIL-002', name: 'Groundnut Oil', hsn: '1508', price: 1120, qty: 2 }
    ]
  };

  var figures = invoice.computeInvoiceFigures(order);
  assertInvoiceMatchesCheckout(order);
  assert.deepEqual(
    { discount: figures.discount, tax: figures.tax, total: figures.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});
