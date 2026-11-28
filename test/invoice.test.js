var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function summarizeInvoice(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    })
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the checkout HSN slabs', function () {
  // Checkout stores HSN on order items and leaves gstRate unset.
  var order = {
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ],
    coupon: ''
  };
  var figures = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summarizeInvoice(figures), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    rows: [
      { gstPercent: 5, line: 200, lineTax: 10 },
      { gstPercent: 12, line: 300, lineTax: 36 }
    ]
  });
  assert.deepEqual(billed.lines.map(function (line) {
    return [line.gstPercent, line.tax];
  }), [[5, 10], [12, 36]]);
  assert.equal(billed.tax, 46);
  assert.equal(billed.total, 546);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  var order = {
    items: [{ name: 'Tea', price: 300, qty: 2, hsn: '0902' }],
    coupon: 'SAVE10'
  };
  var figures = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summarizeInvoice(figures), {
    subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2,
    rows: [{ gstPercent: 18, line: 600, lineTax: 97.2 }]
  });
  assert.equal(billed.discount, 60);
  assert.equal(billed.tax, 97.2);
  assert.equal(billed.total, figures.total);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', function () {
  var order = {
    items: [{ name: 'Tea', price: 280, qty: 8, hsn: '0902' }],
    coupon: 'SAVE10'
  };
  var figures = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summarizeInvoice(figures), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    rows: [{ gstPercent: 18, line: 2240, lineTax: 376.2 }]
  });
  assert.equal(billed.subtotal, 2240);
  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 376.2);
  assert.equal(billed.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', function () {
  var order = {
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 100, qty: 1, hsn: '0901', gstRate: 18 }
    ],
    coupon: ''
  };
  var figures = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summarizeInvoice(figures), {
    subtotal: 380, discount: 0, tax: 68.4, cgst: 34.2, sgst: 34.2, total: 448.4,
    rows: [
      { gstPercent: 18, line: 280, lineTax: 50.4 },
      { gstPercent: 18, line: 100, lineTax: 18 }
    ]
  });
  assert.equal(billed.discount, figures.discount);
  assert.equal(billed.tax, figures.tax);
  assert.equal(billed.cgst, figures.cgst);
  assert.equal(billed.sgst, figures.sgst);
  assert.equal(billed.total, figures.total);
});

test('invoice matches checkout for mixed HSN slabs with a capped coupon', function () {
  var order = {
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 340, qty: 6, hsn: '0405' }
    ],
    coupon: 'SAVE10'
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var figures = invoice.computeInvoiceFigures(order);
  var expected = {
    subtotal: 2240, discount: 150, tax: 237.74, cgst: 118.87, sgst: 118.87, total: 2327.74,
    rows: [
      { gstPercent: 5, line: 200, lineTax: 9.33 },
      { gstPercent: 12, line: 2040, lineTax: 228.41 }
    ]
  };

  assert.deepEqual({
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total,
    rows: billed.lines.map(function (line) {
      return { gstPercent: line.gstPercent, line: line.gross, lineTax: line.tax };
    })
  }, expected);
  assert.deepEqual(summarizeInvoice(figures), expected);
});
