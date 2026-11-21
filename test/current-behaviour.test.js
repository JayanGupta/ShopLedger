'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

// This line shape matches routes/orders.js: it stores hsn, but not gstRate.
function routeOrderLine(price, qty, hsn) {
  return {
    id: 1,
    sku: 'TEST-001',
    name: 'Test item',
    hsn: hsn || '1006',
    price: price,
    qty: qty
  };
}

test('Invoice figures match order pricing for an HSN-rated line', function () {
  var line = routeOrderLine(100, 1);
  var billed = pricing.computeTotals([line], '');
  var printed = invoice.computeInvoiceFigures({ items: [line], coupon: '' });

  assert.deepEqual(
    { subtotal: printed.subtotal, discount: printed.discount, tax: printed.tax, cgst: printed.cgst, sgst: printed.sgst, total: printed.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, cgst: billed.cgst, sgst: billed.sgst, total: billed.total }
  );
  assert.equal(printed.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(printed.rows[0].lineTax, billed.lines[0].tax);
});

test('Invoice applies coupon discount before GST as order pricing does', function () {
  var line = routeOrderLine(600, 1);
  var billed = pricing.computeTotals([line], 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: [line], coupon: 'SAVE10' });

  assert.deepEqual(
    { subtotal: printed.subtotal, discount: printed.discount, tax: printed.tax, total: printed.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total }
  );
  assert.equal(printed.discount, 60);
  assert.equal(printed.tax, 27);
  assert.equal(printed.total, 567);
});

test('Invoice honors coupon minimum subtotal as order pricing does', function () {
  var line = routeOrderLine(100, 1);
  var billed = pricing.computeTotals([line], 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: [line], coupon: 'SAVE10' });

  assert.equal(billed.discount, 0);
  assert.equal(printed.discount, 0);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
});

test('GST reconciliation reports no mismatch when invoice reflects billed order figures', function () {
  var line = routeOrderLine(600, 1);
  var billed = pricing.computeTotals([line], 'SAVE10');
  var order = {
    id: 4,
    date: '21/11/2026',
    customer: 'Test customer',
    coupon: 'SAVE10',
    items: [line],
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total,
    status: 'completed'
  };

  var recon = reports.getGstReconciliation({
    orders: [order],
    products: [],
    customers: [],
    settlements: []
  });

  assert.equal(recon.totalChecked, 1);
  assert.equal(recon.mismatchCount, 0);
  assert.equal(recon.totalDelta, 0);
  assert.equal(recon.rows[0].delta, 0);
  assert.equal(recon.rows[0].matched, true);
  assert.equal(recon.rows[0].ledgerTax, 27);
  assert.equal(recon.rows[0].invoiceTax, 27);
});

test('Invoice figures reflect the amounts billed at order placement', function () {
  var line = routeOrderLine(640, 1);
  var billed = pricing.computeTotals([line], 'SAVE10');
  var printed = invoice.computeInvoiceFigures({
    id: 5,
    items: [line],
    coupon: 'SAVE10',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  });

  assert.deepEqual(
    { subtotal: printed.subtotal, discount: printed.discount, tax: printed.tax, cgst: printed.cgst, sgst: printed.sgst, total: printed.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, cgst: billed.cgst, sgst: billed.sgst, total: billed.total }
  );
  assert.equal(printed.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(printed.rows[0].lineTax, billed.lines[0].tax);
});

