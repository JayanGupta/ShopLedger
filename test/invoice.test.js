'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(id, name, price, hsn, gstRate, qty = 1) {
  return { id, name, sku: 'SKU-' + id, price, qty, hsn, gstRate };
}

function assertCurrent(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
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

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      line(1, 'Rice', 640, '1006', 5),
      line(6, 'Ghee', 450, '0405', 12)
    ]
  };

  assertCurrent(order, {
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
  }, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('INVOICE MATCHES CHECKOUT: #1002 SAVE10 applies to mixed-rate items', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line(1, 'Rice', 640, '1006', 5),
      line(6, 'Ghee', 450, '0405', 12)
    ]
  };

  assertCurrent(order, {
    subtotal: 1090,
    discount: 109,
    tax: 77.4,
    cgst: 38.7,
    sgst: 38.7,
    total: 1058.4,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Ghee', sku: 'SKU-6', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 48.6 }
    ]
  }, {
    subtotal: 1090,
    discount: 109,
    tax: 77.4,
    cgst: 38.7,
    sgst: 38.7,
    total: 1058.4
  });
});

test('INVOICE MATCHES CHECKOUT: #1004 SAVE10 applies ₹150 cap before tax', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [line(1, 'Rice', 2240, '1006', 5)]
  };

  assertCurrent(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 2240, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% items without coupon', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      line(8, 'Tea', 1000, '0902', 18),
      line(9, 'Coffee', 250, '0901', 18, 2)
    ]
  };

  assertCurrent(order, {
    subtotal: 1500,
    discount: 0,
    tax: 270,
    cgst: 135,
    sgst: 135,
    total: 1770,
    rows: [
      { name: 'Tea', sku: 'SKU-8', hsn: '0902', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 180 },
      { name: 'Coffee', sku: 'SKU-9', hsn: '0901', qty: 2, price: 250, gstPercent: 18, line: 500, lineTax: 90 }
    ]
  }, {
    subtotal: 1500,
    discount: 0,
    tax: 270,
    cgst: 135,
    sgst: 135,
    total: 1770
  });
});

test('INVOICE MATCHES CHECKOUT: #1001 saved HSN items omit gstRate', function () {
  const items = [
    { id: 1, sku: 'SKU-1', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
    { id: 6, sku: 'SKU-6', name: 'Ghee', hsn: '0405', price: 450, qty: 1 }
  ];
  const order = { id: 1001, coupon: '', items };

  assert.equal(Object.prototype.hasOwnProperty.call(items[0], 'gstRate'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(items[1], 'gstRate'), false);

  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, '');

  assert.deepEqual(invoiceFigures, {
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
  });
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      gstPercents: checkoutFigures.lines.map(function (item) { return item.gstPercent; })
    },
    {
      subtotal: 1090,
      discount: 0,
      tax: 86,
      cgst: 43,
      sgst: 43,
      total: 1176,
      gstPercents: [5, 12]
    }
  );
});

test('INVOICE MATCHES CHECKOUT: mixed HSN slabs with SAVE10 cap', function () {
  const items = [
    { id: 1, sku: 'SKU-1', name: 'Rice', hsn: '1006', price: 1600, qty: 1 },
    { id: 6, sku: 'SKU-6', name: 'Ghee', hsn: '0405', price: 640, qty: 1 }
  ];
  const order = { id: 1004, coupon: 'SAVE10', items };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.equal(checkoutFigures.discount, 150);
  assert.deepEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 146.3,
    cgst: 73.15,
    sgst: 73.15,
    total: 2236.3,
    rows: [
      { name: 'Rice', sku: 'SKU-1', hsn: '1006', qty: 1, price: 1600, gstPercent: 5, line: 1600, lineTax: 74.64 },
      { name: 'Ghee', sku: 'SKU-6', hsn: '0405', qty: 1, price: 640, gstPercent: 12, line: 640, lineTax: 71.66 }
    ]
  });
  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total
    },
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total
    }
  );
});
