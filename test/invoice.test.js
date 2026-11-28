var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
    ]
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var actual = invoice.computeInvoiceFigures(order);
  assert.strictEqual(billed.discount, 150);
  assert.strictEqual(billed.tax, 177.65);
  assert.strictEqual(billed.total, 2267.65);
  ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'].forEach(function (field) {
    assert.strictEqual(actual[field], billed[field], field);
  });
  assert.deepStrictEqual(actual.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 52.25], [12, 125.4]]);
  order.total = billed.total;
  var html = invoice.render(order);
  assert.ok(html.includes('₹2267.65'));
  assert.ok(html.includes('₹177.65'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));
});

// Synthetic in-memory orders model the requested scenarios, not database records.
// Undefined gstRate deliberately exercises HSN lookup.
var cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice uses per-line HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
        { name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    invoice: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    rows: [[5, 200, 10], [12, 300, 36]],
    checkout: { subtotal: 500, discount: 0, tax: 46, total: 546 },
    checkoutLines: [[5, 10], [12, 36]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 applies before invoice GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [{ name: 'Rice', price: 510, qty: 2, hsn: '1006', gstRate: undefined }]
    },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    rows: [[5, 1020, 45.9]],
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 },
    checkoutLines: [[5, 45.9]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [{ name: 'Rice', price: 560, qty: 4, hsn: '1006', gstRate: undefined }]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    rows: [[5, 2240, 104.5]],
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 },
    checkoutLines: [[5, 104.5]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% invoice matches checkout',
    order: {
      id: 1008,
      coupon: '',
      items: [{ name: 'Tea', price: 250, qty: 2, hsn: '0902', gstRate: 18 }]
    },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [[18, 500, 90]],
    checkout: { subtotal: 500, discount: 0, tax: 90, total: 590 },
    checkoutLines: [[18, 90]]
  }
];

cases.forEach(function (fixture) {
  test(fixture.name, function () {
    var actual = invoice.computeInvoiceFigures(fixture.order);
    var checkout = pricing.computeTotals(fixture.order.items, fixture.order.coupon);

    Object.keys(fixture.invoice).forEach(function (field) {
      assert.strictEqual(actual[field], fixture.invoice[field], 'invoice ' + field);
    });
    assert.deepStrictEqual(actual.rows.map(function (row) {
      return [row.gstPercent, row.line, row.lineTax];
    }), fixture.rows, 'invoice GST breakdown');

    Object.keys(fixture.checkout).forEach(function (field) {
      assert.strictEqual(checkout[field], fixture.checkout[field], 'checkout ' + field);
    });
    assert.deepStrictEqual(checkout.lines.map(function (line) {
      return [line.gstPercent, line.tax];
    }), fixture.checkoutLines, 'checkout GST breakdown');
  });
});
