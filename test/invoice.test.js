var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');
var db = require('../data/db.json');

test('all eight sample invoices match the amounts customers were billed', function () {
  db.orders.forEach(function (order) {
    var figures = invoice.computeInvoiceFigures(order);
    ['subtotal', 'discount', 'tax', 'total'].forEach(function (field) {
      assert.equal(figures[field], order[field], 'Order ' + order.id + ': ' + field);
    });
    assert.equal(Math.round((figures.cgst + figures.sgst) * 100), Math.round(order.tax * 100));
    assert.ok(!invoice.render(order).includes('Accountant Reconciliation Notice'));
  });
  assert.equal(reports.getGstReconciliation(db).mismatchCount, 0);
});

test('invoice rows use post-discount HSN tax and enforce the SAVE10 cap', function () {
  var figures = invoice.computeInvoiceFigures(db.orders.find(function (o) { return o.id === 1004; }));
  assert.equal(figures.discount, 150);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 104.5);
  assert.equal(figures.total, 2194.5);
});

test('invoices reuse coupon eligibility and handle explicit zero/decimal GST rates', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  ['SAVE10', 'DIWALI20', 'UNKNOWN'].forEach(function (coupon) {
    var figures = invoice.computeInvoiceFigures({ items: items, coupon: coupon });
    assert.equal(figures.discount, 0);
    assert.equal(figures.total, 105);
  });
  assert.equal(invoice.computeInvoiceFigures({ items: items, coupon: ' welcome ' }).total, 99.75);
  items[0].gstRate = 0;
  assert.equal(invoice.computeInvoiceFigures({ items: items }).tax, 0);
  items[0].gstRate = 0.12;
  assert.equal(invoice.computeInvoiceFigures({ items: items }).tax, 12);
});
