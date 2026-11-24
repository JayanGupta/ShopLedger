var test = require('node:test');
var assert = require('node:assert').strict;
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

function compare(order, expectedInvoice, expectedCheckout, expectedLines) {
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), expectedInvoice, 'invoice amounts');
  assert.deepEqual(figures(billed), expectedCheckout, 'checkout amounts');
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.hsn, row.gstPercent, row.lineTax];
  }), expectedLines.invoice, 'invoice line GST by HSN');
  assert.deepEqual(billed.lines.map(function (line) {
    return [line.hsn, line.gstPercent, line.tax];
  }), expectedLines.checkout, 'checkout line GST by HSN');
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', function () {
  // Order snapshots carry the HSN. Checkout and invoice both resolve GST from that HSN.
  compare({
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', price: 90, qty: 1, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 260, qty: 2, hsn: '0405' }
    ]
  }, {
    subtotal: 610, discount: 0, tax: 66.90, cgst: 33.45, sgst: 33.45, total: 676.90
  }, {
    subtotal: 610, discount: 0, tax: 66.90, cgst: 33.45, sgst: 33.45, total: 676.90
  }, {
    invoice: [['1006', 5, 4.50], ['0405', 12, 62.40]],
    checkout: [['1006', 5, 4.50], ['0405', 12, 62.40]]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  // An explicit whole-percent rate makes both paths use 18%, isolating coupon order.
  compare({
    id: 1002,
    coupon: 'SAVE10',
    items: [{ id: 3, name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: 18 }]
  }, {
    subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20
  }, {
    subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20
  }, {
    invoice: [['0902', 18, 97.20]],
    checkout: [['0902', 18, 97.20]]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap', function () {
  compare({
    id: 1004,
    coupon: 'SAVE10',
    items: [{ id: 4, name: 'Coffee', price: 560, qty: 4, hsn: '0901' }]
  }, {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20
  }, {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20
  }, {
    invoice: [['0901', 18, 376.20]],
    checkout: [['0901', 18, 376.20]]
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% order without a coupon matches checkout', function () {
  compare({
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', price: 75, qty: 2, hsn: '0902' },
      { id: 4, name: 'Coffee', price: 250, qty: 1, hsn: '0901' }
    ]
  }, {
    subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472
  }, {
    subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472
  }, {
    invoice: [['0902', 18, 27], ['0901', 18, 45]],
    checkout: [['0902', 18, 27], ['0901', 18, 45]]
  });
});

test('invoice matches checkout for mixed HSN slabs and a capped SAVE10 coupon', function () {
  var expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65
  };
  var lines = [['1006', 5, 52.25], ['0405', 12, 125.40]];

  compare({
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 280, qty: 4, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
    ]
  }, expected, expected, { invoice: lines, checkout: lines });
});
