var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figures(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

function compare(items, coupon, expectedInvoice, expectedCheckout, expectedRows) {
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: coupon });
  var checkout = pricing.computeTotals(items, coupon);

  assert.deepStrictEqual(figures(printed), expectedInvoice, 'invoice amounts');
  assert.deepStrictEqual(figures(checkout), expectedCheckout, 'checkout amounts');
  assert.deepStrictEqual(printed.rows.map(function (row) {
    return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
  }), expectedRows, 'invoice GST by line');
}

test('invoice matches checkout for mixed HSN slabs with a capped coupon', function () {
  var items = [
    { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
    { name: 'Butter', hsn: '0405', price: 400, qty: 4 }
  ];
  var expected = { subtotal: 2240, discount: 150, tax: 209, cgst: 104.5, sgst: 104.5, total: 2299 };
  compare(items, 'SAVE10', expected, expected, [
    { hsn: '1006', gstPercent: 5, line: 640, lineTax: 29.86 },
    { hsn: '0405', gstPercent: 12, line: 1600, lineTax: 179.14 }
  ]);
});

test('CURRENT BEHAVIOUR: #1001-style invoice uses mixed HSN slabs without a coupon', function () {
  // Use 12% butter in place of tea to cover the requested 5% and 12% mix.
  compare([
    { name: 'Toor dal', price: 165, qty: 2, hsn: '0713' },
    { name: 'Butter', price: 280, qty: 1, hsn: '0405' }
  ], '',
  { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 },
  { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 },
  [
    { hsn: '0713', gstPercent: 5, line: 330, lineTax: 16.5 },
    { hsn: '0405', gstPercent: 12, line: 280, lineTax: 33.6 }
  ]);
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 discounts the invoice before tax', function () {
  compare([
    { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
    { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
  ], 'SAVE10',
  { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
  { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
  [
    { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
    { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.1 }
  ]);
});

test('CURRENT BEHAVIOUR: #1004-style invoice honors the SAVE10 cap', function () {
  compare([
    { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }
  ], 'SAVE10',
  { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
  { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
  [
    { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
  ]);
});

test('CURRENT BEHAVIOUR: #1008-style all-18% invoice matches checkout without a coupon', function () {
  var expected = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  compare([
    { name: 'Tea', price: 140, qty: 1, hsn: '0902' },
    { name: 'Sherbet', price: 180, qty: 2, hsn: '2106' }
  ], '', expected, expected, [
    { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.2 },
    { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.8 }
  ]);
});
