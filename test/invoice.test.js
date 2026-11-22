var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Entirely in-memory fixtures; no store/server imports or database access.
// HSN-only lines intentionally omit gstRate, as saved order lines do today.
// #1001 uses the requested 5%/12% mix rather than a database copy.
var cases = [
  {
    name: '#1001 HSN-only 5%/12% invoice matches checkout',
    id: 1001,
    coupon: '',
    items: [
      { id: 2, name: 'Dal', hsn: '0713', price: 165, qty: 2 },
      { id: 7, name: 'Butter', hsn: '0405', price: 260, qty: 1 }
    ],
    invoice: [590, 0, 47.7, 23.85, 23.85, 637.7],
    invoiceRows: [[5, 330, 16.5], [12, 260, 31.2]],
    checkout: [590, 0, 47.7, 23.85, 23.85, 637.7],
    checkoutRows: [[5, 16.5], [12, 31.2]]
  },
  {
    name: '#1002 SAVE10 invoice discount applies before GST',
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { id: 4, name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ],
    invoice: [1020, 102, 45.9, 22.95, 22.95, 963.9],
    invoiceRows: [[5, 640, 28.8], [5, 380, 17.1]],
    checkout: [1020, 102, 45.9, 22.95, 22.95, 963.9],
    checkoutRows: [[5, 28.8], [5, 17.1]]
  },
  {
    name: '#1004 invoice respects SAVE10 cap at Rs 2240',
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
    ],
    invoice: [2240, 150, 104.5, 52.25, 52.25, 2194.5],
    invoiceRows: [[5, 2240, 104.5]],
    checkout: [2240, 150, 104.5, 52.25, 52.25, 2194.5],
    checkoutRows: [[5, 104.5]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% items without coupon match checkout',
    id: 1008,
    coupon: '',
    items: [
      { id: 8, name: 'Tea', hsn: '0902', price: 140, qty: 1 },
      { id: 12, name: 'Sherbet', hsn: '2106', price: 180, qty: 2 }
    ],
    invoice: [500, 0, 90, 45, 45, 590],
    invoiceRows: [[18, 140, 25.2], [18, 360, 64.8]],
    checkout: [500, 0, 90, 45, 45, 590],
    checkoutRows: [[18, 25.2], [18, 64.8]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1001 explicit percentage gstRate matches checkout',
    id: 1001,
    coupon: '',
    items: [
      { id: 2, name: 'Dal', hsn: '0713', gstRate: 5, price: 165, qty: 2 },
      { id: 7, name: 'Butter', hsn: '0405', gstRate: 12, price: 260, qty: 1 }
    ],
    invoice: [590, 0, 47.7, 23.85, 23.85, 637.7],
    invoiceRows: [[5, 330, 16.5], [12, 260, 31.2]],
    checkout: [590, 0, 47.7, 23.85, 23.85, 637.7],
    checkoutRows: [[5, 16.5], [12, 31.2]]
  }
];

function figures(result) {
  return [result.subtotal, result.discount, result.tax,
    result.cgst, result.sgst, result.total];
}

cases.forEach(function (fixture) {
  test(fixture.name, function () {
    var order = { id: fixture.id, items: fixture.items, coupon: fixture.coupon };
    var before = JSON.stringify(order);
    var billed = pricing.computeTotals(order.items, order.coupon);
    // Stored totals must not silently become the expected invoice calculation.
    order.subtotal = billed.subtotal;
    order.discount = billed.discount;
    order.tax = billed.tax;
    order.total = billed.total;
    var printed = invoice.computeInvoiceFigures(order);

    assert.deepStrictEqual(figures(printed), fixture.invoice, 'invoice figures');
    assert.deepStrictEqual(printed.rows.map(function (row) {
      return [row.gstPercent, row.line, row.lineTax];
    }), fixture.invoiceRows, 'invoice GST breakdown');
    assert.deepStrictEqual(figures(billed), fixture.checkout, 'checkout figures');
    assert.deepStrictEqual(billed.lines.map(function (line) {
      return [line.gstPercent, line.tax];
    }), fixture.checkoutRows, 'checkout GST breakdown');
    assert.strictEqual(JSON.stringify({
      id: order.id, items: order.items, coupon: order.coupon
    }), before, 'calculations leave fixture items and coupon unchanged');
  });
});

test('invoice matches checkout HSN GST and capped pre-tax coupon discount', function () {
  var order = {
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 2 },
      { id: 7, name: 'Butter', hsn: '0405', price: 260, qty: 1 },
      { id: 8, name: 'Tea', hsn: '0902', price: 140, qty: 5 }
    ],
    coupon: 'SAVE10'
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(billed), [2240, 150, 206.38, 103.19, 103.19, 2296.38]);
  assert.deepStrictEqual(figures(printed), figures(billed));
  assert.deepStrictEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 59.71], [12, 29.11], [18, 117.56]]);
  assert.deepStrictEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), billed.lines.map(function (line) {
    return [line.gstPercent, line.tax];
  }));
  var html = invoice.render(Object.assign({ id: 1009, total: billed.total }, order));
  assert.ok(html.includes('₹2296.38'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));
});
