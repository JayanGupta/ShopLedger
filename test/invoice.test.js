'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// The order route stores HSN on each line but does not store gstRate.
function line(name, hsn, price, qty) {
  return {
    name: name,
    hsn: hsn,
    price: price,
    qty: qty,
    gstRate: null
  };
}

function order(id, items, coupon) {
  return {
    id: id,
    items: items,
    coupon: coupon || ''
  };
}

function assertInvoiceAndCheckout(orderData, expected) {
  var invoiceFigures = invoice.computeInvoiceFigures(orderData);
  var checkoutFigures = pricing.computeTotals(orderData.items, orderData.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    gstPercents: invoiceFigures.rows.map(function (row) { return row.gstPercent; })
  }, expected.invoice);

  assert.deepEqual({
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total
  }, expected.checkout);
}

test('CURRENT BEHAVIOUR: order #1001 invoice uses the 5% and 18% HSN slabs like checkout', function () {
  assertInvoiceAndCheckout(order(1001, [
    line('Assam CTC Masala Chai 250g', '0902', 140, 2),
    line('Unpolished Toor Dal 1kg', '0713', 165, 2)
  ]), {
    invoice: {
      subtotal: 610,
      discount: 0,
      tax: 66.9,
      cgst: 33.45,
      sgst: 33.45,
      total: 676.9,
      gstPercents: [18, 5]
    },
    checkout: {
      subtotal: 610,
      discount: 0,
      tax: 66.9,
      cgst: 33.45,
      sgst: 33.45,
      total: 676.9
    }
  });
});

test('CURRENT BEHAVIOUR: order #1002 invoice applies SAVE10 before its 5% HSN GST', function () {
  assertInvoiceAndCheckout(order(1002, [
    line('Indrayani Basmati Rice 5kg', '1006', 640, 1),
    line('Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
  ], 'SAVE10'), {
    invoice: {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      gstPercents: [5, 5]
    },
    checkout: {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9
    }
  });
});

test('CURRENT BEHAVIOUR: order #1004 invoice applies the SAVE10 cap before 5% HSN GST', function () {
  assertInvoiceAndCheckout(order(1004, [
    line('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
  ], 'SAVE10'), {
    invoice: {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      gstPercents: [5]
    },
    checkout: {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5
    }
  });
});

test('CURRENT BEHAVIOUR: order #1008 invoice and checkout match for 18% items without a coupon', function () {
  assertInvoiceAndCheckout(order(1008, [
    line('Assam CTC Masala Chai 250g', '0902', 140, 1),
    line('Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
  ]), {
    invoice: {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      gstPercents: [18, 18]
    },
    checkout: {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590
    }
  });
});

test('invoice figures match checkout totals and per-line HSN GST for representative orders', function () {
  var orders = [
    order(1001, [
      line('Assam CTC Masala Chai 250g', '0902', 140, 2),
      line('Unpolished Toor Dal 1kg', '0713', 165, 2)
    ]),
    order(1002, [
      line('Indrayani Basmati Rice 5kg', '1006', 640, 1),
      line('Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
    ], 'SAVE10'),
    order(1004, [
      line('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
    ], 'SAVE10'),
    order(1008, [
      line('Assam CTC Masala Chai 250g', '0902', 140, 1),
      line('Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
    ])
  ];

  orders.forEach(function (orderData) {
    var invoiceFigures = invoice.computeInvoiceFigures(orderData);
    var checkoutFigures = pricing.computeTotals(orderData.items, orderData.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total
    }, {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total
    }, 'invoice totals should match checkout for order #' + orderData.id);

    assert.deepEqual(invoiceFigures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, lineTax: row.lineTax };
    }), checkoutFigures.lines.map(function (lineData) {
      return { gstPercent: lineData.gstPercent, lineTax: lineData.tax };
    }), 'invoice line GST should match checkout for order #' + orderData.id);
  });
});
