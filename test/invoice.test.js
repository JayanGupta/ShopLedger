var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function summary(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice totals mixed 5% and 12% items without a coupon', function () {
  var order = {
    coupon: '',
    items: [
      { name: '5% item', price: 140, qty: 2, hsn: '1006', gstRate: 5 },
      { name: '12% item', price: 165, qty: 2, hsn: '0405', gstRate: 12 }
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(summary(invoiceFigures), {
    subtotal: 610, discount: 0, tax: 53.6, cgst: 26.8, sgst: 26.8, total: 663.6
  });
  assert.deepStrictEqual(summary(checkoutFigures), {
    subtotal: 610, discount: 0, tax: 53.6, cgst: 26.8, sgst: 26.8, total: 663.6
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice matches checkout after SAVE10', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(summary(invoiceFigures), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
  assert.deepStrictEqual(summary(checkoutFigures), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap before tax', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(summary(invoiceFigures), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepStrictEqual(summary(checkoutFigures), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for all-18% items without a coupon', function () {
  var order = {
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Kokum concentrate', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(summary(invoiceFigures), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepStrictEqual(summary(checkoutFigures), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
});

test('invoice matches checkout for a capped SAVE10 discount on an HSN-rated order', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }
    ]
  };
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(summary(invoice.computeInvoiceFigures(order)), summary(checkoutFigures));
});
