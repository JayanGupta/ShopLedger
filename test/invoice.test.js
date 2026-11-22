var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function calculate(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice preserves mixed 5% and 12% GST without a coupon', function () {
  var result = calculate({
    coupon: '',
    items: [
      { name: 'Toor Dal', price: 165, qty: 2, hsn: '0713', gstRate: 5 },
      { name: 'Table Butter', price: 260, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  });

  assert.deepEqual(result.invoice, {
    subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85,
    total: 637.7,
    rows: [
      { name: 'Toor Dal', sku: '-', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'Table Butter', sku: '-', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
    ]
  });
  assert.equal(result.checkout.total, 637.7);
  assert.equal(result.checkout.tax, 47.7);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice uses checkout GST and discount figures', function () {
  var result = calculate({
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Sunflower Oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  });

  assert.equal(result.invoice.subtotal, 1020);
  assert.equal(result.invoice.tax, 45.9);
  assert.equal(result.invoice.discount, 102);
  assert.equal(result.invoice.total, 963.9);
  assert.equal(result.checkout.discount, 102);
  assert.equal(result.checkout.tax, 45.9);
  assert.equal(result.checkout.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the ₹150 cap before tax', function () {
  var result = calculate({
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  });

  assert.equal(result.invoice.subtotal, 2240);
  assert.equal(result.invoice.tax, 104.5);
  assert.equal(result.invoice.discount, 150);
  assert.equal(result.invoice.total, 2194.5);
  assert.equal(result.checkout.discount, 150);
  assert.equal(result.checkout.tax, 104.5);
  assert.equal(result.checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', function () {
  var result = calculate({
    coupon: '',
    items: [
      { name: 'Masala Chai', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Kokum Sherbet', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  });

  assert.equal(result.invoice.subtotal, 500);
  assert.equal(result.invoice.tax, 90);
  assert.equal(result.invoice.discount, 0);
  assert.equal(result.invoice.total, 590);
  assert.equal(result.checkout.tax, 90);
  assert.equal(result.checkout.total, 590);
});

test('invoice uses the checkout HSN GST slab and capped pre-tax SAVE10 discount', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508' }
    ]
  };

  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(pricing.computeTotals(order.items, order.coupon).total, 2194.5);
});
