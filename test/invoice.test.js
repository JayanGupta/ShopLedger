var test = require('node:test');
var assert = require('node:assert');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  var { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  var { lines, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual({
    ...invoiceTotals,
    gstByLine: rows.map(function (row) {
      return { percent: row.gstPercent, tax: row.lineTax };
    })
  }, expectedInvoice, 'invoice figures');

  assert.deepStrictEqual({
    ...checkoutTotals,
    gstByLine: lines.map(function (line) {
      return { percent: line.gstPercent, tax: line.tax };
    })
  }, expectedCheckout, 'checkout figures');
}

test('CURRENT BEHAVIOUR: #1001-style invoice uses the 5% and 12% HSN slabs', function () {
  // These order lines have an HSN and no explicit gstRate.
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Toor dal', price: 165, qty: 2, hsn: '0713' },
      { name: 'Butter', price: 260, qty: 1, hsn: '0405' }
    ]
  };

  assertFigures(order, {
    subtotal: 590, discount: 0, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70,
    gstByLine: [{ percent: 5, tax: 16.50 }, { percent: 12, tax: 31.20 }]
  }, {
    subtotal: 590, discount: 0, taxable: 590, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70,
    gstByLine: [{ percent: 5, tax: 16.50 }, { percent: 12, tax: 31.20 }]
  });
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  };

  assertFigures(order, {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    gstByLine: [{ percent: 5, tax: 28.80 }, { percent: 5, tax: 17.10 }]
  }, {
    subtotal: 1020, discount: 102, taxable: 918, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    gstByLine: [{ percent: 5, tax: 28.80 }, { percent: 5, tax: 17.10 }]
  });
});

test('CURRENT BEHAVIOUR: #1004-style invoice caps SAVE10 at 150', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };

  assertFigures(order, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
    gstByLine: [{ percent: 5, tax: 104.50 }]
  }, {
    subtotal: 2240, discount: 150, taxable: 2090, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
    gstByLine: [{ percent: 5, tax: 104.50 }]
  });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for 18% items without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Sherbet concentrate', price: 180, qty: 2, hsn: '2106' }
    ]
  };

  assertFigures(order, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    gstByLine: [{ percent: 18, tax: 25.20 }, { percent: 18, tax: 64.80 }]
  }, {
    subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590,
    gstByLine: [{ percent: 18, tax: 25.20 }, { percent: 18, tax: 64.80 }]
  });
});

test('invoice matches checkout for mixed HSN slabs with capped SAVE10 before GST', function () {
  var order = {
    id: 2001,
    coupon: 'SAVE10',
    total: 2257.20,
    items: [
      { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
      { name: 'Butter', price: 320, qty: 3, hsn: '0405' }
    ]
  };

  var expectedInvoice = {
    subtotal: 2240, discount: 150, tax: 167.20, cgst: 83.60, sgst: 83.60, total: 2257.20,
    gstByLine: [{ percent: 5, tax: 59.71 }, { percent: 12, tax: 107.49 }]
  };

  assertFigures(order, expectedInvoice, { ...expectedInvoice, taxable: 2090 });

  var html = invoice.render(order);
  assert.match(html, /Gross Subtotal<\/td><td class="r">₹2240\.00/);
  assert.match(html, /Total GST\)<\/td><td class="r">₹167\.20/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2257\.20/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
