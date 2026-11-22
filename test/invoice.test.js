'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return { id, name, sku: 'SKU-' + id, price, qty, hsn, gstRate };
}

function assertCurrentFigures(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.equal(checkoutFigures.subtotal, expectedCheckout.subtotal);
  assert.equal(checkoutFigures.discount, expectedCheckout.discount);
  assert.equal(checkoutFigures.tax, expectedCheckout.tax);
  assert.equal(checkoutFigures.cgst, expectedCheckout.cgst);
  assert.equal(checkoutFigures.sgst, expectedCheckout.sgst);
  assert.equal(checkoutFigures.total, expectedCheckout.total);
}

test('CURRENT BEHAVIOUR: #1001 style order invoices 5% and 12% items without a coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item(1, 'Rice', 640, 1, '1006', 5),
      item(6, 'Ghee', 450, 1, '0405', 12)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'SKU-6', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 });
});

test('CURRENT BEHAVIOUR: #1002 style SAVE10 discount and GST match checkout', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item(1, 'Rice', 640, 1, '1006', 5),
      item(4, 'Sunflower oil', 190, 2, '1512', 5)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower oil', sku: 'SKU-4', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 });
});

test('CURRENT BEHAVIOUR: #1004 style SAVE10 invoice applies the ₹150 discount cap', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item(5, 'Groundnut oil', 1120, 2, '1508', 5)]
  };

  assertCurrentFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut oil', sku: 'SKU-5', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 style order invoices 18% items without a coupon', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item(8, 'Packaged tea', 140, 1, '0902', 18),
      item(12, 'Kokum concentrate', 180, 2, '2106', 18)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Packaged tea', sku: 'SKU-8', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum concentrate', sku: 'SKU-12', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 });
});

test('Invoice figures match checkout HSN GST and capped pre-tax coupon totals', function () {
  const orders = [
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, sku: 'GRN-001', name: 'Indrayani Basmati Rice 5kg', hsn: '1006', price: 640, qty: 1 },
        { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', price: 190, qty: 2 }
      ]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', price: 1120, qty: 2 }
      ]
    }
  ];

  orders.forEach(function (order) {
    const actual = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.equal(actual.subtotal, checkout.subtotal, 'order #' + order.id + ' subtotal');
    assert.equal(actual.discount, checkout.discount, 'order #' + order.id + ' capped coupon discount');
    assert.equal(actual.tax, checkout.tax, 'order #' + order.id + ' post-discount GST');
    assert.equal(actual.cgst, checkout.cgst, 'order #' + order.id + ' CGST');
    assert.equal(actual.sgst, checkout.sgst, 'order #' + order.id + ' SGST');
    assert.equal(actual.total, checkout.total, 'order #' + order.id + ' billed total');
    assert.deepEqual(actual.rows.map(function (row) {
      return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    }), checkout.lines.map(function (line) {
      return { hsn: line.hsn, gstPercent: line.gstPercent, line: line.gross, lineTax: line.tax };
    }), 'order #' + order.id + ' per-line HSN GST');
  });
});
