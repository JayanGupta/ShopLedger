'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn, gstRate) {
  return { name, sku: name, price, qty, hsn, gstRate };
}

const order1001 = {
  id: 1001,
  coupon: '',
  items: [
    line('Toor Dal', 165, 2, '0713', 5),
    line('Ghee', 140, 2, '0405', 12)
  ]
};

const order1002 = {
  id: 1002,
  coupon: 'SAVE10',
  items: [
    line('Rice', 640, 1, '1006', 5),
    line('Sunflower Oil', 190, 2, '1512', 5)
  ]
};

const order1004 = {
  id: 1004,
  coupon: 'SAVE10',
  items: [line('Groundnut Oil', 1120, 2, '1508', 5)]
};

const order1008 = {
  id: 1008,
  coupon: '',
  items: [
    line('Packaged Tea', 140, 1, '0902', 18),
    line('Kokum Concentrate', 180, 2, '2106', 18)
  ]
};

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon', function () {
  const checkout = pricing.computeTotals(order1001.items, order1001.coupon);
  const result = invoice.computeInvoiceFigures(order1001);

  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 610, discount: 0, tax: 50.1, total: 660.1 }
  );
  assert.deepEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 }
  );
  assert.deepEqual(result.rows.map(row => row.gstPercent), [5, 12]);
});

test('#1002 SAVE10 discount and GST match checkout', function () {
  const checkout = pricing.computeTotals(order1002.items, order1002.coupon);
  const result = invoice.computeInvoiceFigures(order1002);

  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
  assert.deepEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
  assert.equal(result.rows[0].gstPercent, 5);
});

test('#1004 SAVE10 discount is capped and GST is calculated after discount', function () {
  const checkout = pricing.computeTotals(order1004.items, order1004.coupon);
  const result = invoice.computeInvoiceFigures(order1004);

  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
  assert.deepEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 all-18% items without a coupon', function () {
  const checkout = pricing.computeTotals(order1008.items, order1008.coupon);
  const result = invoice.computeInvoiceFigures(order1008);

  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
  assert.deepEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
  assert.deepEqual(result.rows.map(row => row.gstPercent), [18, 18]);
});

test('Invoice figures match checkout using HSN slabs and capped pre-tax coupon discounts', function () {
  const orders = [order1001, order1002, order1004, order1008].map(function (order) {
    return {
      id: order.id,
      coupon: order.coupon,
      items: order.items.map(function (item) {
        const storedLine = Object.assign({}, item);
        delete storedLine.gstRate;
        return storedLine;
      })
    };
  });

  orders.forEach(function (order) {
    const checkout = pricing.computeTotals(order.items, order.coupon);
    const result = invoice.computeInvoiceFigures(order);

    assert.deepEqual(
      { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
      { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total },
      'order #' + order.id + ' invoice totals should match checkout'
    );
    assert.deepEqual(
      result.rows.map(function (row) { return { gstPercent: row.gstPercent, lineTax: row.lineTax }; }),
      checkout.lines.map(function (line) { return { gstPercent: line.gstPercent, lineTax: line.tax }; }),
      'order #' + order.id + ' invoice GST lines should match checkout'
    );
  });
});
