var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var reports = require('../lib/reports');

function orderWith(items, coupon) {
  return {
    id: 2001,
    date: '01/04/2022',
    customer: 'Characterization Customer',
    status: 'completed',
    items: items,
    coupon: coupon || '',
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0
  };
}

test('invoice matches billed HSN GST and total for an HSN-only coupon order', function () {
  var items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ];
  var order = orderWith(items, 'WELCOME');
  var billed = pricing.computeTotals(items, order.coupon);
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.tax, billed.tax);
  assert.equal(figures.cgst, billed.cgst);
  assert.equal(figures.sgst, billed.sgst);
  assert.equal(figures.discount, billed.discount);
  assert.equal(figures.total, billed.total);
});

test('invoice uses the HSN slab for an HSN-only line', function () {
  var order = orderWith([
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ]);

  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 100);
  assert.equal(figures.tax, 5);
  assert.equal(figures.cgst, 2.5);
  assert.equal(figures.sgst, 2.5);
  assert.equal(figures.total, 105);
});

test('order pricing uses the HSN slab for the same HSN-only line', function () {
  var totals = pricing.computeTotals([
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ], '');

  assert.equal(totals.tax, 5);
  assert.equal(totals.cgst, 2.5);
  assert.equal(totals.sgst, 2.5);
  assert.equal(totals.total, 105);
});

test('invoice applies percent coupon discount before HSN GST', function () {
  var order = orderWith([
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ], 'WELCOME');

  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.tax, 4.75);
  assert.equal(figures.discount, 5);
  assert.equal(figures.total, 99.75);
});

test('order pricing applies coupon discount before HSN GST', function () {
  var totals = pricing.computeTotals([
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ], 'WELCOME');

  assert.equal(totals.discount, 5);
  assert.equal(totals.tax, 4.75);
  assert.equal(totals.total, 99.75);
});

test('invoice honors an explicit truthy gstRate instead of the HSN slab', function () {
  var order = orderWith([
    { id: 1, name: 'Rice', hsn: '1006', gstRate: 5, price: 100, qty: 1 }
  ]);

  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});

test('reconciliation matches stored billing and invoice figures', function () {
  var storedOrder = orderWith([
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ], 'WELCOME');
  var ledgerTotals = pricing.computeTotals(storedOrder.items, storedOrder.coupon);
  storedOrder.subtotal = ledgerTotals.subtotal;
  storedOrder.discount = ledgerTotals.discount;
  storedOrder.tax = ledgerTotals.tax;
  storedOrder.total = ledgerTotals.total;

  var reconciliation = reports.getGstReconciliation({ orders: [storedOrder] });

  assert.equal(reconciliation.totalChecked, 1);
  assert.equal(reconciliation.mismatchCount, 0);
  assert.equal(reconciliation.totalDelta, 0);
  assert.deepEqual(reconciliation.rows[0], {
    orderId: 2001,
    date: '01/04/2022',
    customer: 'Characterization Customer',
    coupon: 'WELCOME',
    ledgerSubtotal: 100,
    ledgerDiscount: 5,
    ledgerTax: 4.75,
    ledgerTotal: 99.75,
    invoiceDiscount: 5,
    invoiceTax: 4.75,
    invoiceTotal: 99.75,
    delta: 0,
    matched: true
  });
});  
