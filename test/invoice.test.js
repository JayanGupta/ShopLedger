var test = require('node:test');
var assert = require('node:assert').strict;
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function assertFigures(figures, expected) {
  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  }, expected);
}

test('CURRENT BEHAVIOUR: #1001-style invoice uses the checkout GST rates for mixed HSN slabs', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 250, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 500, qty: 1, hsn: '0405' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assertFigures(printed, { subtotal: 1000, discount: 0, tax: 85, cgst: 42.5, sgst: 42.5, total: 1085 });
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.hsn, row.gstPercent, row.lineTax];
  }), [['1006', 5, 25], ['0405', 12, 60]]);
  assertFigures(checkout, { subtotal: 1000, discount: 0, tax: 85, cgst: 42.5, sgst: 42.5, total: 1085 });
  assert.deepEqual(checkout.lines.map(function (line) {
    return line.gstPercent;
  }), [5, 12]);
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 500, qty: 2, hsn: '0902', gstRate: 18 }]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assertFigures(printed, { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 });
  assert.equal(printed.rows[0].lineTax, 162);
  assertFigures(checkout, { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 });
});

test('CURRENT BEHAVIOUR: #1004 invoice honours the SAVE10 cap on a ₹2,240 subtotal', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    items: [{ name: 'Cold-Pressed Groundnut Oil 5L', price: 1120, qty: 2, hsn: '1508' }]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assertFigures(printed, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.equal(printed.rows[0].lineTax, 104.5);
  assertFigures(checkout, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });

  var html = invoice.render(order);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹104\.50<\/td>/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2194\.50/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('CURRENT BEHAVIOUR: #1008 all-18% order without a coupon matches checkout', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 150, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 200, qty: 1, hsn: '0901' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);
  var expected = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };

  assertFigures(printed, expected);
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[18, 54], [18, 36]]);
  assertFigures(checkout, expected);
});

test('invoice matches checkout for mixed GST slabs with a capped SAVE10 coupon', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
    ]
  };
  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  var expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65
  };
  assertFigures(checkout, expected);
  assertFigures(printed, expected);
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 52.25], [12, 125.4]]);
});
