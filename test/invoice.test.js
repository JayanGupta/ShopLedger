var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figures(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% line GST rates', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 2, name: 'Toor Dal', price: 165, qty: 2, hsn: '0713', gstRate: 5 },
      { id: 7, name: 'Table Butter', price: 260, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var result = figures(order);

  assert.deepEqual(result.invoice, {
    subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7,
    rows: [
      { name: 'Toor Dal', sku: '-', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'Table Butter', sku: '-', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
    ]
  });
  assert.equal(result.checkout.total, 637.7);
});

test('CURRENT BEHAVIOUR: #1002 invoice matches SAVE10 checkout GST and discount', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Basmati Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 4, name: 'Sunflower Oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };
  var result = figures(order);

  assert.equal(result.invoice.subtotal, 1020);
  assert.equal(result.invoice.tax, 45.9);
  assert.equal(result.invoice.discount, 102);
  assert.equal(result.invoice.cgst, 22.95);
  assert.equal(result.invoice.sgst, 22.95);
  assert.equal(result.invoice.total, 963.9);
  assert.equal(result.checkout.discount, 102);
  assert.equal(result.checkout.tax, 45.9);
  assert.equal(result.checkout.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 150-rupee cap before GST', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };
  var result = figures(order);

  assert.equal(result.invoice.subtotal, 2240);
  assert.equal(result.invoice.tax, 104.5);
  assert.equal(result.invoice.discount, 150);
  assert.equal(result.invoice.cgst, 52.25);
  assert.equal(result.invoice.sgst, 52.25);
  assert.equal(result.invoice.total, 2194.5);
  assert.equal(result.checkout.discount, 150);
  assert.equal(result.checkout.tax, 104.5);
  assert.equal(result.checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches 18% no-coupon checkout figures', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 8, name: 'Masala Chai', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 12, name: 'Kokum Sherbet', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };
  var result = figures(order);

  assert.equal(result.invoice.subtotal, 500);
  assert.equal(result.invoice.discount, 0);
  assert.equal(result.invoice.tax, 90);
  assert.equal(result.invoice.cgst, 45);
  assert.equal(result.invoice.sgst, 45);
  assert.equal(result.invoice.total, 590);
  assert.deepEqual(result.checkout, {
    subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590,
    lines: [
      { id: 8, name: 'Masala Chai', hsn: '0902', gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
      { id: 12, name: 'Kokum Sherbet', hsn: '2106', gstPercent: 18, gross: 360, discount: 0, taxable: 360, tax: 64.8, net: 424.8 }
    ]
  });
});

test('invoice matches checkout HSN GST and capped coupon totals for #1004', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508' }
    ]
  };
  var result = figures(order);

  assert.equal(result.invoice.subtotal, result.checkout.subtotal);
  assert.equal(result.invoice.discount, result.checkout.discount);
  assert.equal(result.invoice.tax, result.checkout.tax);
  assert.equal(result.invoice.cgst, result.checkout.cgst);
  assert.equal(result.invoice.sgst, result.checkout.sgst);
  assert.equal(result.invoice.total, result.checkout.total);
  assert.equal(result.invoice.rows[0].gstPercent, 5);
  assert.equal(result.invoice.rows[0].lineTax, 104.5);
});
