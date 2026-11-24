'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, sku, hsn, price, qty, gstRate) {
  return { id, name, sku, hsn, price, qty, gstRate };
}

function assertCurrentFigures(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, expectedInvoice);
  assert.deepStrictEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total
    },
    expectedCheckout
  );
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% rates without a coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      item(6, 'A2 Gir Cow Ghee 500ml', 'DRY-001', '0405', 450, 1, 12)
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
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'A2 Gir Cow Ghee 500ml', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176
  });
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 discount is allocated before tax and invoice matches checkout', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      item(4, 'Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
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
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the checkout discount cap before tax', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% no-coupon invoice matches checkout', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
      item(12, 'Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 1, 18)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 320,
    discount: 0,
    tax: 57.6,
    cgst: 28.8,
    sgst: 28.8,
    total: 377.6,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 1, price: 180, gstPercent: 18, line: 180, lineTax: 32.4 }
    ]
  }, {
    subtotal: 320, discount: 0, tax: 57.6, cgst: 28.8, sgst: 28.8, total: 377.6
  });
});

test('invoice uses the checkout HSN rate and capped pre-tax coupon figures', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      // Persisted order snapshots carry HSN, not a separate gstRate field.
      item(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, undefined)
    ]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepStrictEqual(
    [invoiceFigures.subtotal, invoiceFigures.discount, invoiceFigures.tax, invoiceFigures.cgst, invoiceFigures.sgst, invoiceFigures.total],
    [checkoutFigures.subtotal, checkoutFigures.discount, checkoutFigures.tax, checkoutFigures.cgst, checkoutFigures.sgst, checkoutFigures.total]
  );
});
