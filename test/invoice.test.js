'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function order(id, coupon, items) {
  return { id, coupon, items };
}

function figures(orderData) {
  const invoiceFigures = invoice.computeInvoiceFigures(orderData);
  const checkoutFigures = pricing.computeTotals(orderData.items, orderData.coupon);
  return { invoiceFigures, checkoutFigures };
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% GST without a coupon', function () {
  const data = order(1001, '', [
    { name: 'Rice', price: 1000, qty: 1, hsn: '1006', gstRate: 5 },
    { name: 'Ghee', price: 500, qty: 1, hsn: '0405', gstRate: 12 }
  ]);
  const { invoiceFigures, checkoutFigures } = figures(data);

  assert.deepEqual(invoiceFigures, {
    subtotal: 1500,
    discount: 0,
    tax: 110,
    cgst: 55,
    sgst: 55,
    total: 1610,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 50 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 60 }
    ]
  });
  assert.equal(checkoutFigures.tax, 110);
  assert.equal(checkoutFigures.total, 1610);
});

test('invoice matches checkout for #1002 SAVE10', function () {
  const data = order(1002, 'SAVE10', [
    { name: 'Rice', price: 400, qty: 1, hsn: '1006', gstRate: 5 },
    { name: 'Ghee', price: 200, qty: 1, hsn: '0405', gstRate: 12 }
  ]);
  const { invoiceFigures, checkoutFigures } = figures(data);

  assert.equal(invoiceFigures.subtotal, 600);
  assert.equal(invoiceFigures.tax, 39.6);
  assert.equal(invoiceFigures.discount, 60);
  assert.equal(invoiceFigures.cgst, 19.8);
  assert.equal(invoiceFigures.sgst, 19.8);
  assert.equal(invoiceFigures.total, 579.6);
  assert.deepEqual(invoiceFigures.rows.map(function (row) { return row.lineTax; }), [18, 21.6]);
  assert.equal(checkoutFigures.discount, 60);
  assert.equal(checkoutFigures.tax, 39.6);
  assert.equal(checkoutFigures.total, 579.6);
});

test('invoice matches checkout cap for #1004 SAVE10', function () {
  const data = order(1004, 'SAVE10', [
    { name: 'Packaged tea', price: 2240, qty: 1, hsn: '0902', gstRate: 18 }
  ]);
  const { invoiceFigures, checkoutFigures } = figures(data);

  assert.equal(invoiceFigures.subtotal, 2240);
  assert.equal(invoiceFigures.tax, 376.2);
  assert.equal(invoiceFigures.discount, 150);
  assert.equal(invoiceFigures.cgst, 188.1);
  assert.equal(invoiceFigures.sgst, 188.1);
  assert.equal(invoiceFigures.total, 2466.2);
  assert.equal(invoiceFigures.rows[0].lineTax, 376.2);
  assert.equal(checkoutFigures.discount, 150);
  assert.equal(checkoutFigures.tax, 376.2);
  assert.equal(checkoutFigures.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 all 18% GST without a coupon', function () {
  const data = order(1008, '', [
    { name: 'Packaged tea', price: 1000, qty: 1, hsn: '0902', gstRate: 18 }
  ]);
  const { invoiceFigures, checkoutFigures } = figures(data);

  assert.deepEqual(invoiceFigures, {
    subtotal: 1000,
    discount: 0,
    tax: 180,
    cgst: 90,
    sgst: 90,
    total: 1180,
    rows: [
      { name: 'Packaged tea', sku: '-', hsn: '0902', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 180 }
    ]
  });
  assert.equal(checkoutFigures.tax, 180);
  assert.equal(checkoutFigures.total, 1180);
});

test('invoice matches checkout for HSN slabs and capped SAVE10 discount', function () {
  const data = order(1004, 'SAVE10', [
    { name: 'Rice', price: 1000, qty: 1, hsn: '1006' },
    { name: 'Ghee', price: 500, qty: 1, hsn: '0405' },
    { name: 'Packaged tea', price: 740, qty: 1, hsn: '0902' }
  ]);
  const { invoiceFigures, checkoutFigures } = figures(data);

  assert.deepEqual(invoiceFigures, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 46.65 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 55.98 },
      { name: 'Packaged tea', sku: '-', hsn: '0902', qty: 1, price: 740, gstPercent: 18, line: 740, lineTax: 124.28 }
    ]
  });
  assert.equal(checkoutFigures.discount, 150);
  assert.equal(checkoutFigures.tax, 226.91);
  assert.equal(checkoutFigures.total, 2316.91);
});
