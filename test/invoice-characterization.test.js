'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

test('HSN slab and coupon produce matching billed and invoice totals', function () {
  var items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 1000, qty: 1 }
  ];

  var billed = pricing.computeTotals(items, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: 'SAVE10'
  });

  assert.equal(billed.subtotal, 1000);
  assert.equal(billed.discount, 100);
  assert.equal(billed.tax, 45);
  assert.equal(billed.total, 945);

  assert.equal(invoiceFigures.subtotal, 1000);
  assert.equal(invoiceFigures.discount, 100);
  assert.equal(invoiceFigures.tax, 45);
  assert.equal(invoiceFigures.total, 945);
});

test('invoice line GST uses discounted value and HSN slab', function () {
  var items = [
    { id: 2, name: 'Rice', hsn: '1006', price: 1000, qty: 1 }
  ];

  var billed = pricing.computeTotals(items, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: 'SAVE10'
  });

  assert.deepEqual(
    {
      taxable: billed.lines[0].taxable,
      tax: billed.lines[0].tax,
      gstPercent: billed.lines[0].gstPercent
    },
    { taxable: 900, tax: 45, gstPercent: 5 }
  );
  assert.deepEqual(
    {
      line: invoiceFigures.rows[0].line,
      lineTax: invoiceFigures.rows[0].lineTax,
      gstPercent: invoiceFigures.rows[0].gstPercent
    },
    { line: 1000, lineTax: 45, gstPercent: 5 }
  );
});

test('fractional gstRate is interpreted as a decimal rate by invoice calculation', function () {
  var items = [
    { id: 3, name: 'Rice', hsn: '1006', gstRate: 0.05, price: 100, qty: 1 }
  ];

  var billed = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: ''
  });

  assert.equal(billed.tax, 5);
  assert.equal(invoiceFigures.tax, 5);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
});

test('reconciliation compares recomputed invoice figures and omits cancelled orders', function () {
  var db = {
    orders: [
      {
        id: 10,
        date: '01/01/2022',
        customer: 'Test customer',
        status: 'completed',
        items: [{ id: 1, name: 'Rice', hsn: '1006', price: 1000, qty: 1 }],
        coupon: 'SAVE10',
        subtotal: 1000,
        discount: 100,
        tax: 45,
        total: 945
      },
      {
        id: 11,
        status: 'cancelled',
        items: [{ id: 1, name: 'Rice', hsn: '1006', price: 1000, qty: 1 }],
        coupon: 'SAVE10',
        subtotal: 1000,
        discount: 100,
        tax: 45,
        total: 945
      }
    ]
  };

  var result = reports.getGstReconciliation(db);

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].invoiceTax, 45);
  assert.equal(result.rows[0].matched, true);
});


test('printable invoice agrees with the billed GST and total', function () {
  var order = {
    id: 42, items: [{ name: 'Rice', hsn: '1006', price: 1000, qty: 1 }],
    coupon: 'SAVE10', subtotal: 1000, discount: 100, tax: 45, total: 945
  };
  var figures = invoice.computeInvoiceFigures(order);
  assert.equal(figures.total, order.total);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.cgst, 22.5);
  assert.equal(figures.sgst, 22.5);
  assert.match(invoice.render(order), /Invoice Total<\/td><td class="r">₹945\.00/);
});
