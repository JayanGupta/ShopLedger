'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(id, name, price, qty, hsn, gstRate) {
  return { id: id, name: name, sku: 'SKU-' + id, price: price, qty: qty, hsn: hsn, gstRate: gstRate };
}

var cases = [
  {
    name: 'CURRENT BEHAVIOUR: order 1001 invoice applies supplied GST rates without a coupon',
    items: [line(8, 'Tea', 140, 2, '0902', 18), line(2, 'Toor Dal', 165, 2, '0713', 5)],
    coupon: '',
    invoiceExpected: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, gst: [18, 5] },
    pricingExpected: { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  },
  {
    name: 'order 1002 invoice matches checkout percent discount and GST',
    items: [line(1, 'Rice', 640, 1, '1006', 5), line(4, 'Sunflower Oil', 190, 2, '1512', 5)],
    coupon: 'SAVE10',
    invoiceExpected: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gst: [5, 5] },
    pricingExpected: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  },
  {
    name: 'order 1004 invoice matches checkout SAVE10 cap and GST',
    items: [line(5, 'Groundnut Oil', 1120, 2, '1508', 5)],
    coupon: 'SAVE10',
    invoiceExpected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gst: [5] },
    pricingExpected: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order 1008 invoice and pricing agree for 18% items without a coupon',
    items: [line(8, 'Tea', 140, 1, '0902', 18), line(12, 'Kokum Sherbet', 180, 2, '2106', 18)],
    coupon: '',
    invoiceExpected: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gst: [18, 18] },
    pricingExpected: { subtotal: 500, discount: 0, tax: 90, total: 590 }
  }
];

cases.forEach(function (scenario) {
  test(scenario.name, function () {
    var invoiceResult = invoice.computeInvoiceFigures({ items: scenario.items, coupon: scenario.coupon });
    var pricingResult = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual({
      subtotal: invoiceResult.subtotal,
      discount: invoiceResult.discount,
      tax: invoiceResult.tax,
      cgst: invoiceResult.cgst,
      sgst: invoiceResult.sgst,
      total: invoiceResult.total,
      gst: invoiceResult.rows.map(function (row) { return row.gstPercent; })
    }, scenario.invoiceExpected);
    assert.deepEqual({
      subtotal: pricingResult.subtotal,
      discount: pricingResult.discount,
      tax: pricingResult.tax,
      total: pricingResult.total
    }, scenario.pricingExpected);
  });
});

test('invoice matches checkout GST slabs and capped coupon discount for order 1004', function () {
  var items = [line(5, 'Groundnut Oil', 1120, 2, '1508')];
  var invoiceResult = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });
  var pricingResult = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual({
    subtotal: invoiceResult.subtotal,
    discount: invoiceResult.discount,
    tax: invoiceResult.tax,
    cgst: invoiceResult.cgst,
    sgst: invoiceResult.sgst,
    total: invoiceResult.total,
    gst: invoiceResult.rows.map(function (row) { return row.gstPercent; })
  }, {
    subtotal: pricingResult.subtotal,
    discount: pricingResult.discount,
    tax: pricingResult.tax,
    cgst: pricingResult.cgst,
    sgst: pricingResult.sgst,
    total: pricingResult.total,
    gst: pricingResult.lines.map(function (row) { return row.gstPercent; })
  });
});
