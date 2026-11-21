'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Synthetic in-memory order fixtures; tests never load the store or data/db.json.
var cases = [
  {
    name: 'TICKET 1: #1001 5% and 12% items, no coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, sku: 'RICE-5', name: 'Rice', hsn: '1006', price: 100, qty: 1 },
        { id: 2, sku: 'GHEE-12', name: 'Ghee', hsn: '0405', price: 200, qty: 1 }
      ]
    },
    checkout: { subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329, gstPercents: [5, 12] },
    invoice: {
      subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329,
      rows: [
        { name: 'Rice', sku: 'RICE-5', hsn: '1006', qty: 1, price: 100, gstPercent: 5, discount: 0, taxable: 100, line: 100, lineTax: 5 },
        { name: 'Ghee', sku: 'GHEE-12', hsn: '0405', qty: 1, price: 200, gstPercent: 12, discount: 0, taxable: 200, line: 200, lineTax: 24 }
      ]
    }
  },
  {
    name: 'TICKET 1: #1002 SAVE10',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
        { id: 4, sku: 'OIL-001', name: 'Sunflower Oil', hsn: '1512', price: 190, qty: 2 }
      ]
    },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gstPercents: [5, 5] },
    invoice: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, discount: 64, taxable: 576, line: 640, lineTax: 28.8 },
        { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, discount: 38, taxable: 342, line: 380, lineTax: 17.1 }
      ]
    }
  },
  {
    name: 'TICKET 1: #1004 SAVE10 on ₹2,240 with ₹150 cap',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, sku: 'OIL-002', name: 'Groundnut Oil', hsn: '1508', price: 1120, qty: 2 }
      ]
    },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercents: [5] },
    invoice: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, discount: 150, taxable: 2090, line: 2240, lineTax: 104.5 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18%, no coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 250, qty: 2 },
        { id: 9, sku: 'BEV-002', name: 'Coffee', hsn: '0901', price: 80, qty: 1 }
      ]
    },
    checkout: { subtotal: 580, discount: 0, tax: 104.4, cgst: 52.2, sgst: 52.2, total: 684.4, gstPercents: [18, 18] },
    invoice: {
      subtotal: 580, discount: 0, tax: 104.4, cgst: 52.2, sgst: 52.2, total: 684.4,
      rows: [
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 2, price: 250, gstPercent: 18, discount: 0, taxable: 500, line: 500, lineTax: 90 },
        { name: 'Coffee', sku: 'BEV-002', hsn: '0901', qty: 1, price: 80, gstPercent: 18, discount: 0, taxable: 80, line: 80, lineTax: 14.4 }
      ]
    }
  }
];

cases.forEach(function (fixture) {
  test(fixture.name, function () {
    var invoiceResult = invoice.computeInvoiceFigures(fixture.order);
    var checkoutResult = pricing.computeTotals(fixture.order.items, fixture.order.coupon);
    var checkoutSummary = {
      subtotal: checkoutResult.subtotal,
      discount: checkoutResult.discount,
      tax: checkoutResult.tax,
      cgst: checkoutResult.cgst,
      sgst: checkoutResult.sgst,
      total: checkoutResult.total,
      gstPercents: checkoutResult.lines.map(function (line) {
        return line.gstPercent;
      })
    };

    assert.deepEqual(invoiceResult, fixture.invoice);
    assert.deepEqual(checkoutSummary, fixture.checkout);
  });
});

test('Invoice subtotal, discount, GST breakdown, and total match checkout for Ticket 1 orders', function () {
  var ticketOrders = [
    {
      id: 1001,
      coupon: '',
      items: [
        { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 140, qty: 2 },
        { id: 2, sku: 'GRN-002', name: 'Toor Dal', hsn: '0713', price: 165, qty: 2 }
      ]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
        { id: 4, sku: 'OIL-001', name: 'Sunflower Oil', hsn: '1512', price: 190, qty: 2 }
      ]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, sku: 'OIL-002', name: 'Groundnut Oil', hsn: '1508', price: 1120, qty: 2 }
      ]
    },
    {
      id: 1007,
      coupon: '',
      items: [
        { id: 6, sku: 'DRY-001', name: 'Ghee', hsn: '0405', price: 450, qty: 2 },
        { id: 4, sku: 'OIL-001', name: 'Sunflower Oil', hsn: '1512', price: 190, qty: 2 }
      ]
    }
  ];

  ticketOrders.forEach(function (order) {
    var actual = invoice.computeInvoiceFigures(order);
    var checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(
      {
        subtotal: actual.subtotal,
        discount: actual.discount,
        tax: actual.tax,
        cgst: actual.cgst,
        sgst: actual.sgst,
        total: actual.total
      },
      {
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        tax: checkout.tax,
        cgst: checkout.cgst,
        sgst: checkout.sgst,
        total: checkout.total
      },
      'invoice and checkout must agree for order #' + order.id
    );
    assert.deepEqual(
      actual.rows,
      checkout.lines.map(function (line, index) {
        var item = order.items[index];
        return {
          name: item.name,
          sku: item.sku || '-',
          hsn: item.hsn || '-',
          qty: item.qty,
          price: item.price,
          gstPercent: line.gstPercent,
          discount: line.discount,
          taxable: line.taxable,
          line: line.gross,
          lineTax: line.tax
        };
      }),
      'invoice line discounts and taxable values must match checkout for order #' + order.id
    );
  });
});

test('Invoice coupon allocations reconcile line values with checkout rounding', function () {
  var items = [1, 2, 3].map(function (id) {
    return { id: id, name: 'Item ' + id, hsn: '1006', price: 333.33, qty: 1 };
  });
  var order = { id: 1009, coupon: 'SAVE10', items: items };
  var invoiceResult = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(items, order.coupon);

  assert.equal(invoiceResult.rows.length, items.length);
  assert.equal(invoiceResult.discount, checkout.discount);
  assert.equal(pricing.round2(invoiceResult.rows.reduce(function (sum, row) {
    return sum + row.discount;
  }, 0)), checkout.discount);
  assert.equal(pricing.round2(invoiceResult.rows.reduce(function (sum, row) {
    return sum + row.taxable;
  }, 0)), checkout.taxable);
  assert.equal(pricing.round2(invoiceResult.rows.reduce(function (sum, row) {
    return sum + row.lineTax;
  }, 0)), checkout.tax);
  assert.equal(pricing.round2(invoiceResult.rows.reduce(function (sum, row) {
    return sum + row.taxable + row.lineTax;
  }, 0)), checkout.total);

  invoiceResult.rows.forEach(function (row, index) {
    assert.equal(row.line, pricing.round2(items[index].price * items[index].qty));
    assert.equal(row.taxable, pricing.round2(row.line - row.discount));
    assert.equal(row.lineTax, checkout.lines[index].tax);
  });
});
