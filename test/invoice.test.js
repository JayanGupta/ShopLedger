'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return { id: id, name: name, sku: 'TEST-' + id, price: price, qty: qty, hsn: hsn, gstRate: gstRate };
}

function characterize(order) {
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);
  return { invoice: invoiceFigures, checkout: checkoutFigures };
}

test('CURRENT BEHAVIOUR: order #1001 invoice figures with 5% and 12% GST and no coupon', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      item(1, 'Rice', 640, 1, '1006', 5),
      item(6, 'Ghee', 450, 1, '0405', 12)
    ]
  };

  var figures = characterize(order);
  assert.deepEqual(figures.invoice, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'TEST-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'TEST-6', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.equal(figures.checkout.total, 1176);
});

test('invoice order #1002 applies SAVE10 before calculating GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item(1, 'Rice', 640, 1, '1006', 5),
      item(6, 'Ghee', 450, 1, '0405', 12)
    ]
  };

  var figures = characterize(order);
  assert.deepEqual(figures.invoice, {
    subtotal: 1090,
    discount: 109,
    tax: 77.4,
    cgst: 38.7,
    sgst: 38.7,
    total: 1058.4,
    rows: [
      { name: 'Rice', sku: 'TEST-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Ghee', sku: 'TEST-6', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 48.6 }
    ]
  });
  assert.equal(figures.checkout.discount, 109);
  assert.equal(figures.checkout.tax, 77.4);
  assert.equal(figures.checkout.total, 1058.4);
});

test('invoice order #1004 applies the SAVE10 cap before calculating GST', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item(5, 'Groundnut oil', 1120, 1, '1508', 5),
      item(1, 'Rice', 640, 1, '1006', 5),
      item(6, 'Ghee', 450, 1, '0405', 12),
      item(99, 'Other taxable item', 30, 1, '9999', 18)
    ]
  };

  var figures = characterize(order);
  assert.deepEqual(figures.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 137.53,
    cgst: 68.77,
    sgst: 68.76,
    total: 2227.53,
    rows: [
      { name: 'Groundnut oil', sku: 'TEST-5', hsn: '1508', qty: 1, price: 1120, gstPercent: 5, line: 1120, lineTax: 52.25 },
      { name: 'Rice', sku: 'TEST-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 29.86 },
      { name: 'Ghee', sku: 'TEST-6', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 50.38 },
      { name: 'Other taxable item', sku: 'TEST-99', hsn: '9999', qty: 1, price: 30, gstPercent: 18, line: 30, lineTax: 5.04 }
    ]
  });
  assert.equal(figures.checkout.discount, 150);
  assert.equal(figures.checkout.total, 2227.53);
});

test('invoice matches checkout discount cap and post-discount HSN tax', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item(5, 'Groundnut oil', 1120, 1, '1508', 5),
      item(1, 'Rice', 640, 1, '1006', 5),
      item(6, 'Ghee', 450, 1, '0405', 12),
      item(99, 'Other taxable item', 30, 1, '9999', 18)
    ]
  };

  var checkout = pricing.computeTotals(order.items, order.coupon);
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    rows: [
      { name: 'Groundnut oil', sku: 'TEST-5', hsn: '1508', qty: 1, price: 1120, gstPercent: 5, line: 1120, lineTax: 52.25 },
      { name: 'Rice', sku: 'TEST-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 29.86 },
      { name: 'Ghee', sku: 'TEST-6', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 50.38 },
      { name: 'Other taxable item', sku: 'TEST-99', hsn: '9999', qty: 1, price: 30, gstPercent: 18, line: 30, lineTax: 5.04 }
    ]
  });
});

test('CURRENT BEHAVIOUR: order #1008 invoice figures use 18% GST when all items are 18%', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      item(8, 'Tea', 140, 2, '0902', 18)
    ]
  };

  var figures = characterize(order);
  assert.deepEqual(figures.invoice, {
    subtotal: 280,
    discount: 0,
    tax: 50.4,
    cgst: 25.2,
    sgst: 25.2,
    total: 330.4,
    rows: [
      { name: 'Tea', sku: 'TEST-8', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 }
    ]
  });
  assert.equal(figures.checkout.total, 330.4);
});
