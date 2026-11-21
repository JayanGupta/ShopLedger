var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figures(result, lineGst) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total,
    lineGst: lineGst
  };
}

function assertFigures(items, coupon, expectedInvoice, expectedCheckout) {
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: coupon });
  var checkout = pricing.computeTotals(items, coupon);

  assert.deepStrictEqual(figures(printed, printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  })), expectedInvoice, 'invoice figures and per-line GST');

  assert.deepStrictEqual(figures(checkout, checkout.lines.map(function (line) {
    return [line.gstPercent, line.tax];
  })), expectedCheckout, 'checkout figures and per-line GST');
}

// Lines without gstRate use their HSN slab.
test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', function () {
  var items = [
    { name: 'Rice', price: 60, qty: 5, hsn: '1006' },
    { name: 'Ghee', price: 155, qty: 2, hsn: '0405' }
  ];

  var expected = {
    subtotal: 610, discount: 0, tax: 52.20, cgst: 26.10, sgst: 26.10, total: 662.20,
    lineGst: [[5, 15], [12, 37.20]]
  };

  assertFigures(items, '', expected, expected);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  var items = [
    { name: 'Rice', price: 60, qty: 10, hsn: '1006' },
    { name: 'Sunflower oil', price: 210, qty: 2, hsn: '1512' }
  ];

  var expected = {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    lineGst: [[5, 27], [5, 18.90]]
  };

  assertFigures(items, 'SAVE10', expected, expected);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', function () {
  var items = [
    { name: 'Groundnut oil', price: 280, qty: 8, hsn: '1508' }
  ];

  var expected = {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
    lineGst: [[5, 104.50]]
  };

  assertFigures(items, 'SAVE10', expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice matches checkout without a coupon', function () {
  var items = [
    { name: 'Tea', price: 150, qty: 2, hsn: '0902', gstRate: 18 },
    { name: 'Syrup', price: 200, qty: 1, hsn: '2106' }
  ];
  var expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lineGst: [[18, 54], [18, 36]]
  };

  assertFigures(items, '', expected, expected);
});

test('invoice matches checkout for mixed HSN slabs with capped SAVE10', function () {
  var items = [
    { name: 'Groundnut oil', price: 280, qty: 4, hsn: '1508' },
    { name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
  ];
  var expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65,
    lineGst: [[5, 52.25], [12, 125.40]]
  };

  assertFigures(items, 'SAVE10', expected, expected);
});
