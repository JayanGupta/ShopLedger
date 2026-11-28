var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(
    [printed.subtotal, printed.discount, printed.tax, printed.cgst, printed.sgst, printed.total],
    expectedInvoice.totals,
    'invoice: subtotal, discount, GST, CGST, SGST, total'
  );
  assert.deepStrictEqual(printed.rows.map(function (row) {
    return [row.hsn, row.gstPercent, row.line, row.lineTax];
  }), expectedInvoice.rows, 'invoice lines: HSN, GST %, gross, GST');

  assert.deepStrictEqual(
    [billed.subtotal, billed.discount, billed.tax, billed.cgst, billed.sgst, billed.total],
    expectedCheckout.totals,
    'checkout: subtotal, discount, GST, CGST, SGST, total'
  );
  assert.deepStrictEqual(billed.lines.map(function (line) {
    return [line.hsn, line.gstPercent, line.taxable, line.tax];
  }), expectedCheckout.lines, 'checkout lines: HSN, GST %, taxable amount, GST');
}

test('#1001-style invoice uses the 5% and 12% HSN slabs', function () {
  var order = {
    coupon: '',
    items: [
      { name: 'Dal', price: 165, qty: 2, hsn: '0713' },
      { name: 'Ghee', price: 280, qty: 1, hsn: '0405' }
    ]
  };
  assertFigures(order, {
    totals: [610, 0, 50.10, 25.05, 25.05, 660.10],
    rows: [['0713', 5, 330, 16.50], ['0405', 12, 280, 33.60]]
  }, {
    totals: [610, 0, 50.10, 25.05, 25.05, 660.10],
    lines: [['0713', 5, 330, 16.50], ['0405', 12, 280, 33.60]]
  });
});

test('#1002-style invoice applies SAVE10 before GST', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  };
  assertFigures(order, {
    totals: [1020, 102, 45.90, 22.95, 22.95, 963.90],
    rows: [['1006', 5, 640, 28.80], ['1512', 5, 380, 17.10]]
  }, {
    totals: [1020, 102, 45.90, 22.95, 22.95, 963.90],
    lines: [['1006', 5, 576, 28.80], ['1512', 5, 342, 17.10]]
  });
});

test('#1004-style invoice applies the ₹150 SAVE10 cap', function () {
  var order = {
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };
  assertFigures(order, {
    totals: [2240, 150, 104.50, 52.25, 52.25, 2194.50],
    rows: [['1508', 5, 2240, 104.50]]
  }, {
    totals: [2240, 150, 104.50, 52.25, 52.25, 2194.50],
    lines: [['1508', 5, 2090, 104.50]]
  });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches an all-18% order with no coupon', function () {
  var order = {
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Syrup', price: 180, qty: 2, hsn: '2106' }
    ]
  };
  assertFigures(order, {
    totals: [500, 0, 90, 45, 45, 590],
    rows: [['0902', 18, 140, 25.20], ['2106', 18, 360, 64.80]]
  }, {
    totals: [500, 0, 90, 45, 45, 590],
    lines: [['0902', 18, 140, 25.20], ['2106', 18, 360, 64.80]]
  });
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10 before GST', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
      { name: 'Butter', price: 260, qty: 4, hsn: '0405' }
    ]
  };
  assertFigures(order, {
    totals: [2320, 150, 176.59, 88.30, 88.29, 2346.59],
    rows: [['1006', 5, 1280, 59.86], ['0405', 12, 1040, 116.73]]
  }, {
    totals: [2320, 150, 176.59, 88.30, 88.29, 2346.59],
    lines: [['1006', 5, 1197.24, 59.86], ['0405', 12, 972.76, 116.73]]
  });
});
