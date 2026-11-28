var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: printed.subtotal,
    discount: printed.discount,
    tax: printed.tax,
    cgst: printed.cgst,
    sgst: printed.sgst,
    total: printed.total,
    lines: printed.rows.map(function (row) {
      return { gstPercent: row.gstPercent, tax: row.lineTax };
    })
  }, expectedInvoice, 'invoice figures');

  assert.deepEqual({
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total,
    lines: billed.lines.map(function (line) {
      return { gstPercent: line.gstPercent, tax: line.tax };
    })
  }, expectedCheckout, 'checkout figures');
}

// Synthetic items model the order scenarios. An undefined gstRate represents
// a line without a stored rate override, so checkout resolves it by HSN.
test('CURRENT BEHAVIOUR: #1001 invoice matches 5% and 12% HSN checkout rates', function () {
  var expected = {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    lines: [{ gstPercent: 5, tax: 10 }, { gstPercent: 12, tax: 36 }]
  };

  assertFigures({
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { id: 2, name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  }, expected, expected);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  var expected = {
    subtotal: 500, discount: 50, tax: 81, cgst: 40.5, sgst: 40.5, total: 531,
    lines: [{ gstPercent: 18, tax: 81 }]
  };

  assertFigures({
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 3, name: 'Tea', price: 250, qty: 2, hsn: '0902', gstRate: undefined }
    ]
  }, expected, expected);
});

test('CURRENT BEHAVIOUR: #1004 invoice uses the SAVE10 cap and mixed HSN rates', function () {
  var expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65,
    lines: [{ gstPercent: 5, tax: 52.25 }, { gstPercent: 12, tax: 125.4 }]
  };

  assertFigures({
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 112, qty: 10, hsn: '1006', gstRate: undefined },
      { id: 2, name: 'Ghee', price: 560, qty: 2, hsn: '0405', gstRate: undefined }
    ]
  }, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 all-18% order without a coupon matches checkout', function () {
  var expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lines: [{ gstPercent: 18, tax: 36 }, { gstPercent: 18, tax: 54 }]
  };

  assertFigures({
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: undefined },
      { id: 4, name: 'Coffee', price: 300, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  }, expected, expected);
});

test('invoice matches the billed GST breakdown and total on a capped SAVE10 order', function () {
  var expected = {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    lines: [{ gstPercent: 5, tax: 104.5 }]
  };

  assertFigures({
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 112, qty: 20, hsn: '1006', gstRate: undefined }
    ]
  }, expected, expected);
});
