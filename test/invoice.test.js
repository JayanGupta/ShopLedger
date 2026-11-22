var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Synthetic fixtures only: no store import, database access, or config mutation.
// Explicit gstRate values use percentage units (5, 12, 18).
// #1001 deliberately models the requested 5%/12% mix, not a database snapshot.
var cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 explicit 5% and 12% rates agree without a coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
        { id: 6, name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
      ]
    },
    invoice: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    pricing: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    rows: [['1006', 5, 640, 32], ['0405', 12, 450, 54]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 matches checkout GST and discount',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
        { id: 4, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
      ]
    },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    pricing: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    rows: [['1006', 5, 640, 28.8], ['1512', 5, 380, 17.1]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap on INR 2240',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
      ]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    pricing: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    rows: [['1508', 5, 2240, 104.5]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18% rates agree without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 8, name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
        { id: 12, name: 'Kokum concentrate', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
      ]
    },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    pricing: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [['0902', 18, 140, 25.2], ['2106', 18, 360, 64.8]]
  },
  {
    name: 'CURRENT BEHAVIOUR: HSN-only 5% and 12% items invoice at their HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 6, name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    invoice: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    pricing: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    rows: [['1006', 5, 640, 32], ['0405', 12, 450, 54]]
  }
];

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

cases.forEach(function (fixture) {
  test(fixture.name, function () {
    var order = fixture.order;
    var actualInvoice = invoice.computeInvoiceFigures(order);
    var actualPricing = pricing.computeTotals(order.items, order.coupon);

    // Literal expectations pin the figures and per-line GST for each scenario.
    // Neither calculator supplies the other calculator's expected result.
    assert.deepEqual(figures(actualInvoice), fixture.invoice, 'invoice figures');
    assert.deepEqual(figures(actualPricing), fixture.pricing, 'checkout figures');
    assert.deepEqual(actualInvoice.rows.map(function (row) {
      return [row.hsn, row.gstPercent, row.line, row.lineTax];
    }), fixture.rows, 'invoice GST breakdown per line');
  });
});

test('invoice matches checkout for mixed HSN slabs and a capped discount before GST', function () {
  var order = {
    id: 1009,
    coupon: 'SAVE10',
    total: 2861.06,
    items: [
      { id: 5, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' },
      { id: 6, name: 'Ghee', price: 450, qty: 1, hsn: '0405' },
      { id: 8, name: 'Tea', price: 140, qty: 1, hsn: '0902' }
    ]
  };
  var expected = {
    subtotal: 2830, discount: 150, tax: 181.06,
    cgst: 90.53, sgst: 90.53, total: 2861.06
  };
  var checkout = pricing.computeTotals(order.items, order.coupon);
  var actual = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures(checkout), expected, 'checkout reference amounts');
  assert.deepEqual(figures(actual), expected, 'invoice must match billed amounts');
  assert.deepEqual(actual.rows.map(function (row) {
    return [row.hsn, row.gstPercent, row.line, row.lineTax];
  }), [
    ['1508', 5, 2240, 106.06],
    ['0405', 12, 450, 51.14],
    ['0902', 18, 140, 23.86]
  ], 'per-line GST uses the discounted taxable values');

  var html = invoice.render(order);
  ['₹2830.00', '-₹150.00', '₹181.06', '₹2861.06', '₹106.06', '₹51.14', '₹23.86'].forEach(function (amount) {
    assert.ok(html.includes(amount), 'printable invoice includes ' + amount);
  });
  assert.ok(!html.includes('Accountant Reconciliation Notice:'), 'no billed-total mismatch');
});
