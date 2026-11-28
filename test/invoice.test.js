var test = require('node:test');
var assert = require('node:assert/strict');
var config = require('../config');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice matches checkout for mixed GST slabs and capped SAVE10', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 620, qty: 2, hsn: '0405' }
    ]
  };

  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    [printed.subtotal, printed.discount, printed.tax, printed.cgst, printed.sgst, printed.total],
    [2240, 150, 185.49, 92.75, 92.74, 2275.49]
  );
  ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'].forEach(function (field) {
    assert.equal(printed[field], billed[field], field);
  });
  assert.deepEqual(
    printed.rows.map(function (row) { return [row.gstPercent, row.lineTax]; }),
    [[5, 46.65], [12, 138.84]]
  );

  var savedOrder = {
    items: order.items,
    coupon: order.coupon,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  var coupon = config.coupons.SAVE10;
  var previousActive = coupon.active;
  try {
    coupon.active = false;
    assert.deepEqual(invoice.computeInvoiceFigures(savedOrder), printed);
  } finally {
    coupon.active = previousActive;
  }
});

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', function () {
  // Stored checkout lines carry HSN but omit gstRate.
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 100, gstPercent: 5, line: 200, lineTax: 10 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 300, gstPercent: 12, line: 300, lineTax: 36 }
    ]
  });
  assert.deepEqual(billed.lines.map(function (line) { return line.gstPercent; }), [5, 12]);
  assert.equal(billed.tax, 46);
  assert.equal(billed.total, 546);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  // An explicit percentage keeps the rate identical in both calculations.
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Ghee', price: 300, qty: 2, hsn: '0405', gstRate: 12 }]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 600, discount: 60, tax: 64.8, cgst: 32.4, sgst: 32.4, total: 604.8,
    rows: [
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 2, price: 300, gstPercent: 12, line: 600, lineTax: 64.8 }
    ]
  });
  assert.equal(billed.discount, 60);
  assert.equal(billed.tax, 64.8);
  assert.equal(billed.total, printed.total);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap on 2240', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 280, qty: 8, hsn: '0902' }]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 8, price: 280, gstPercent: 18, line: 2240, lineTax: 376.2 }
    ]
  });
  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 376.2);
  assert.equal(billed.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 300, qty: 1, hsn: '0901' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 2, price: 100, gstPercent: 18, line: 200, lineTax: 36 },
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 300, gstPercent: 18, line: 300, lineTax: 54 }
    ]
  });
  assert.equal(billed.discount, printed.discount);
  assert.equal(billed.tax, printed.tax);
  assert.equal(billed.cgst, printed.cgst);
  assert.equal(billed.sgst, printed.sgst);
  assert.equal(billed.total, printed.total);
});
