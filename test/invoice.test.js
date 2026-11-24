var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice matches checkout for mixed HSN slabs and a capped coupon', function () {
  var order = {
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 280, qty: 4 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 560, qty: 2 }
    ],
    coupon: 'SAVE10'
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    [printed.subtotal, printed.discount, printed.tax, printed.cgst, printed.sgst, printed.total],
    [billed.subtotal, 150, billed.tax, billed.cgst, billed.sgst, billed.total]
  );
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 52.25], [12, 125.4]]);
});

function compareFigures(order, expectedInvoice, expectedCheckout) {
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);
  var fields = ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'];

  assert.deepEqual(fields.map(function (field) {
    return printed[field];
  }), expectedInvoice.summary, 'invoice subtotal, discount, GST, CGST, SGST and total');
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.hsn, row.gstPercent, row.line, row.lineTax];
  }), expectedInvoice.rows, 'invoice HSN, GST rate, line gross and line GST');
  assert.deepEqual(fields.map(function (field) {
    return billed[field];
  }), expectedCheckout, 'checkout subtotal, discount, GST, CGST, SGST and total');
}

// HSN-only lines represent saved order items without a gstRate override.
test('CURRENT BEHAVIOUR: #1001 prints the 5% and 12% HSN slabs', function () {
  compareFigures({
    id: 1001,
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 300, qty: 1 }
    ],
    coupon: ''
  }, {
    summary: [500, 0, 46, 23, 23, 546],
    rows: [['1006', 5, 200, 10], ['0405', 12, 300, 36]]
  }, [500, 0, 46, 23, 23, 546]);
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST', function () {
  compareFigures({
    id: 1002,
    items: [{ id: 3, name: 'Tea', hsn: '0902', price: 300, qty: 2 }],
    coupon: 'SAVE10'
  }, {
    summary: [600, 60, 97.2, 48.6, 48.6, 637.2],
    rows: [['0902', 18, 600, 97.2]]
  }, [600, 60, 97.2, 48.6, 48.6, 637.2]);
});

test('CURRENT BEHAVIOUR: #1004 caps SAVE10 at 150 on a 2240 subtotal', function () {
  compareFigures({
    id: 1004,
    items: [{ id: 4, name: 'Coffee', hsn: '0901', price: 560, qty: 4 }],
    coupon: 'SAVE10'
  }, {
    summary: [2240, 150, 376.2, 188.1, 188.1, 2466.2],
    rows: [['0901', 18, 2240, 376.2]]
  }, [2240, 150, 376.2, 188.1, 188.1, 2466.2]);
});

test('CURRENT BEHAVIOUR: #1008 matches checkout with all 18% items and no coupon', function () {
  compareFigures({
    id: 1008,
    items: [
      { id: 3, name: 'Tea', hsn: '0902', price: 100, qty: 1, gstRate: 18 },
      { id: 4, name: 'Coffee', hsn: '0901', price: 125, qty: 2 }
    ],
    coupon: ''
  }, {
    summary: [350, 0, 63, 31.5, 31.5, 413],
    rows: [['0902', 18, 100, 18], ['0901', 18, 250, 45]]
  }, [350, 0, 63, 31.5, 31.5, 413]);
});
