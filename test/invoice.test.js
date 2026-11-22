var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figures(order) {
  return invoice.computeInvoiceFigures(order);
}

function checkout(order) {
  return pricing.computeTotals(order.items, order.coupon);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% gstRate values without a coupon', function () {
  var order = {
    coupon: '',
    items: [
      { name: 'Rice', price: 280, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 330, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var result = figures(order);
  var billed = checkout(order);

  assert.deepStrictEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 610, discount: 0, tax: 53.6, cgst: 26.8, sgst: 26.8, total: 663.6 }
  );
  assert.deepStrictEqual(result.rows.map(function (row) { return [row.gstPercent, row.lineTax]; }), [[5, 14], [12, 39.6]]);
  assert.deepStrictEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 0, tax: 53.6, total: 663.6 }
  );
});

test('#1002 invoice matches checkout GST and SAVE10 discount', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Sunflower Oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };
  var result = figures(order);
  var billed = checkout(order);

  assert.deepStrictEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
  assert.deepStrictEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('#1004 invoice matches checkout GST and capped SAVE10 discount', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };
  var result = figures(order);
  var billed = checkout(order);

  assert.deepStrictEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.deepStrictEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 all-18% lines produce matching invoice and checkout totals without a coupon', function () {
  var order = {
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Kokum Concentrate', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };
  var result = figures(order);
  var billed = checkout(order);

  assert.deepStrictEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
  assert.deepStrictEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 0, tax: 90, total: 590 }
  );
});

test('invoice matches checkout for #1004 HSN GST and capped SAVE10 discount', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508' }
    ]
  };
  var result = figures(order);
  var billed = checkout(order);

  assert.deepStrictEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, cgst: result.cgst, sgst: result.sgst, total: result.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.deepStrictEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, total: result.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total }
  );
});
