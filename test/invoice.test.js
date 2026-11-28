var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function compare(id, items, coupon, expectedInvoice, expectedCheckout) {
  var checkout = pricing.computeTotals(items, coupon);
  var order = {
    id: id,
    items: items,
    coupon: coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    lineGst: figures.rows.map(function (row) {
      return [row.gstPercent, row.lineTax];
    })
  }, expectedInvoice);

  assert.deepEqual({
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total,
    lineGst: checkout.lines.map(function (line) {
      return [line.gstPercent, line.tax];
    })
  }, expectedCheckout);
}

test('#1001 invoice uses the checkout GST rates for mixed HSN lines', function () {
  // These lines carry HSN codes but no explicit GST rate.
  compare(1001, [
    { id: 1, name: 'Rice', price: 200, qty: 2, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 600, qty: 1, hsn: '0405' }
  ], '', {
    subtotal: 1000, discount: 0, tax: 92, cgst: 46, sgst: 46, total: 1092,
    lineGst: [[5, 20], [12, 72]]
  }, {
    discount: 0, tax: 92, total: 1092,
    lineGst: [[5, 20], [12, 72]]
  });
});

test('#1002 invoice applies SAVE10 before calculating GST', function () {
  // An explicit whole-percent rate isolates coupon handling from HSN lookup.
  compare(1002, [
    { id: 2, name: 'Ghee', price: 400, qty: 2, hsn: '0405', gstRate: 12 }
  ], 'SAVE10', {
    subtotal: 800, discount: 80, tax: 86.40, cgst: 43.20, sgst: 43.20, total: 806.40,
    lineGst: [[12, 86.40]]
  }, {
    discount: 80, tax: 86.40, total: 806.40,
    lineGst: [[12, 86.40]]
  });
});

test('#1004 invoice applies the SAVE10 cap before calculating GST', function () {
  compare(1004, [
    { id: 3, name: 'Tea', price: 560, qty: 4, hsn: '0902' }
  ], 'SAVE10', {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20,
    lineGst: [[18, 376.20]]
  }, {
    discount: 150, tax: 376.20, total: 2466.20,
    lineGst: [[18, 376.20]]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice agrees on 18% GST without a coupon', function () {
  compare(1008, [
    { id: 3, name: 'Tea', price: 125, qty: 2, hsn: '0902' },
    { id: 4, name: 'Coffee', price: 125, qty: 1, hsn: '0901' }
  ], '', {
    subtotal: 375, discount: 0, tax: 67.50, cgst: 33.75, sgst: 33.75, total: 442.50,
    lineGst: [[18, 45], [18, 22.50]]
  }, {
    discount: 0, tax: 67.50, total: 442.50,
    lineGst: [[18, 45], [18, 22.50]]
  });
});

test('invoice matches checkout for mixed HSN rates and a capped SAVE10 coupon', function () {
  var items = [
    { id: 1, name: 'Rice', price: 560, qty: 2, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
  ];
  var checkout = pricing.computeTotals(items, 'SAVE10');
  var order = {
    items: items,
    coupon: 'SAVE10',
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    [figures.subtotal, figures.discount, figures.tax, figures.cgst, figures.sgst, figures.total],
    [2240, 150, 177.65, 88.83, 88.82, 2267.65]
  );
  assert.deepEqual(figures.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 52.25], [12, 125.40]]);

  // A reprint can have a saved charge that current pricing cannot reproduce.
  var historicalOrder = Object.assign({}, order, {
    discount: 100, tax: 181.90, total: 2321.90
  });
  var historical = invoice.computeInvoiceFigures(historicalOrder);
  assert.deepEqual(
    [historical.subtotal, historical.discount, historical.tax, historical.cgst, historical.sgst, historical.total],
    [2240, 100, 181.90, 90.95, 90.95, 2321.90]
  );
  assert.deepEqual(historical.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[null, null], [null, null]]);
  assert.match(invoice.render(historicalOrder), /Line-level GST is unavailable/);
});
