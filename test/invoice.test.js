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

test('CURRENT BEHAVIOUR: #1001-inspired invoice uses the 5% and 12% HSN slabs', function () {
  // This in-memory cart uses the requested 5% and 12% pairing.
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Toor dal', price: 165, qty: 2, hsn: '0713' },
      { id: 2, name: 'Ghee', price: 140, qty: 2, hsn: '0405' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1
  });
  assert.deepEqual(printed.rows.map(function (row) {
    return { hsn: row.hsn, gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { hsn: '0713', gstPercent: 5, lineTax: 16.5 },
    { hsn: '0405', gstPercent: 12, lineTax: 33.6 }
  ]);
  assert.deepEqual(billed.lines.map(function (line) { return line.gstPercent; }), [5, 12]);
  assert.deepEqual(figures(billed), {
    subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { id: 2, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
  assert.deepEqual(figures(billed), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap on ₹2,240', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Bulk rice', price: 560, qty: 4, hsn: '1006' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 1, name: 'Tea', price: 125, qty: 2, hsn: '0902' },
      { id: 2, name: 'Coffee', price: 150, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472
  });
  assert.deepEqual(printed.rows.map(function (row) { return row.lineTax; }), [45, 27]);
  assert.deepEqual(figures(billed), figures(printed));
});

test('invoice matches checkout for mixed HSN slabs and a capped SAVE10 coupon', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
    ]
  };

  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures(printed), figures(billed));
  assert.equal(printed.discount, 150);
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 52.25], [12, 125.4]]);
});
