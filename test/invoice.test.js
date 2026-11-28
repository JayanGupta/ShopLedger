'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

var cases = [
  {
    name: 'CURRENT BEHAVIOUR: order #1001 invoice and checkout with 5% and 12% items',
    coupon: '',
    items: [
      { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', gstRate: 5, price: 100, qty: 1 },
      { id: 6, sku: 'DRY-001', name: 'Ghee', hsn: '0405', gstRate: 12, price: 200, qty: 1 }
    ],
    invoice: { subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329, gstPercents: [5, 12] },
    checkout: { subtotal: 300, discount: 0, tax: 29, total: 329 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1002 SAVE10 discount is capped and applied before GST',
    coupon: 'SAVE10',
    items: [
      { id: 1, sku: 'GRN-001', name: 'Indrayani Basmati Rice 5kg', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', gstRate: 5, price: 190, qty: 2 }
    ],
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gstPercents: [5, 5] },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1004 SAVE10 respects the maximum discount before GST',
    coupon: 'SAVE10',
    items: [
      { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ],
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercents: [5] },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 all 18% items without coupon',
    coupon: '',
    items: [
      { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { id: 12, sku: 'BEV-003', name: 'Kokum Sherbet Concentrate 750ml', hsn: '2106', gstRate: 18, price: 180, qty: 2 }
    ],
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gstPercents: [18, 18] },
    checkout: { subtotal: 500, discount: 0, tax: 90, total: 590 }
  }
];

cases.forEach(function (example) {
  test(example.name, function () {
    var invoiceFigures = invoice.computeInvoiceFigures({ items: example.items, coupon: example.coupon });
    var checkoutFigures = pricing.computeTotals(example.items, example.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercents: invoiceFigures.rows.map(function (row) { return row.gstPercent; })
    }, example.invoice);
    assert.deepEqual({
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    }, example.checkout);
  });
});

test('INVOICE MATCHES CHECKOUT: coupon discount is capped and reduces taxable value', function () {
  [cases[1], cases[2]].forEach(function (example) {
    var invoiceFigures = invoice.computeInvoiceFigures({ items: example.items, coupon: example.coupon });
    var checkoutFigures = pricing.computeTotals(example.items, example.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      lineTaxes: invoiceFigures.rows.map(function (row) { return row.lineTax; })
    }, {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      lineTaxes: checkoutFigures.lines.map(function (line) { return line.tax; })
    });
  });
});
