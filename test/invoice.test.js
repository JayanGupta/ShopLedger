var test = require('node:test');
var assert = require('node:assert');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice matches checkout for mixed HSN slabs and capped SAVE10 before tax', function () {
  var order = {
    id: 2001,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', price: 560, qty: 2, hsn: '1006', gstRate: undefined },
      { id: 7, name: 'Butter', sku: 'BUTTER', price: 280, qty: 4, hsn: '0405', gstRate: undefined }
    ]
  };
  var checkout = pricing.computeTotals(order.items, order.coupon);
  var figures = invoice.computeInvoiceFigures(order);
  var expected = { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 };

  Object.keys(expected).forEach(function (key) {
    assert.strictEqual(checkout[key], expected[key], 'checkout ' + key);
    assert.strictEqual(figures[key], expected[key], 'invoice ' + key);
  });
  assert.deepStrictEqual(figures.rows, [
    { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 2, price: 560, gstPercent: 5, line: 1120, lineTax: 52.25 },
    { name: 'Butter', sku: 'BUTTER', hsn: '0405', qty: 4, price: 280, gstPercent: 12, line: 1120, lineTax: 125.4 }
  ]);
  figures.rows.forEach(function (row, index) {
    assert.strictEqual(row.gstPercent, checkout.lines[index].gstPercent);
    assert.strictEqual(row.lineTax, checkout.lines[index].tax);
  });
  order.total = checkout.total;
  var html = invoice.render(order);
  assert.ok(html.includes('₹2267.65'));
  assert.ok(html.includes('₹177.65'));
  assert.ok(html.includes('-₹150.00'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));
});

// Synthetic, in-memory orders only. No store or database access.
// Undefined gstRate models HSN-only order lines, not an explicit rate override.
// The #1001-style fixture deliberately uses the requested 5% / 12% mix.
// Literal invoice expectations pin checkout agreement, including line GST.
var cases = [
  {
    name: '#1001-style invoice uses mixed HSN slabs from checkout',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 7, name: 'Butter', sku: 'DRY-002', price: 260, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 },
    checkoutSlabs: [5, 12],
    expectedInvoice: {
      subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
        { name: 'Butter', sku: 'DRY-002', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
      ]
    },
    matchesCheckout: true
  },
  {
    name: '#1002-style invoice applies SAVE10 before GST like checkout',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 4, name: 'Sunflower oil', sku: 'OIL-001', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutSlabs: [5, 5],
    expectedInvoice: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Sunflower oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    matchesCheckout: true
  },
  {
    name: '#1004-style invoice honors the 150 rupee SAVE10 cap before GST',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutSlabs: [5],
    expectedInvoice: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    matchesCheckout: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008-style all-18% no-coupon invoice matches checkout',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 8, name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
        { id: 12, name: 'Kokum concentrate', sku: 'BEV-003', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutSlabs: [18, 18],
    expectedInvoice: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum concentrate', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    matchesCheckout: true
  }
];

cases.forEach(function (fixture) {
  test(fixture.name, function () {
    var order = fixture.order;
    var actualInvoice = invoice.computeInvoiceFigures(order);
    var actualCheckout = pricing.computeTotals(order.items, order.coupon);

    // Pin the complete invoice, including per-line GST and CGST/SGST split.
    assert.deepStrictEqual(actualInvoice, fixture.expectedInvoice);
    Object.keys(fixture.checkout).forEach(function (key) {
      assert.strictEqual(actualCheckout[key], fixture.checkout[key], 'checkout ' + key);
    });
    assert.deepStrictEqual(actualCheckout.lines.map(function (line) {
      return line.gstPercent;
    }), fixture.checkoutSlabs);
    assert.strictEqual(actualInvoice.total === actualCheckout.total, fixture.matchesCheckout, 'total agreement');
    assert.strictEqual(actualInvoice.tax === actualCheckout.tax, fixture.matchesCheckout, 'GST agreement');
  });
});
