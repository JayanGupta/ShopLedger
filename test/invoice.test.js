var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Synthetic orders modelled on the requested scenarios, not database fixtures.
// Undefined gstRate models HSN-only saved lines; explicit rates use percentages.
var cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-like mixed HSN slabs match checkout',
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: '5% pulses', hsn: '0713', gstRate: undefined, price: 165, qty: 2 },
      { id: 2, name: '12% ghee', hsn: '0405', gstRate: undefined, price: 450, qty: 1 }
    ],
    invoice: { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 },
    rows: [[5, 330, 16.5], [12, 450, 54]],
    checkout: { subtotal: 780, discount: 0, taxable: 780, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 },
    checkoutRates: [5, 12],
    matches: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002-like SAVE10 discounts before GST',
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: '5% rice', hsn: '1006', gstRate: undefined, price: 640, qty: 1 },
      { id: 2, name: '5% oil', hsn: '1512', gstRate: undefined, price: 190, qty: 2 }
    ],
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    rows: [[5, 640, 28.8], [5, 380, 17.1]],
    checkout: { subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutRates: [5, 5],
    matches: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004-like SAVE10 on 2240 respects discount cap',
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: '5% bulk oil', hsn: '1508', gstRate: undefined, price: 1120, qty: 2 }
    ],
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    rows: [[5, 2240, 104.5]],
    checkout: { subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutRates: [5],
    matches: true
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008-like all-18% order without coupon matches checkout',
    id: 1008,
    coupon: '',
    items: [
      { id: 1, name: '18% tea', hsn: '0902', gstRate: 18, price: 140, qty: 2 },
      { id: 2, name: '18% coffee', hsn: '0901', gstRate: undefined, price: 220, qty: 1 }
    ],
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [[18, 280, 50.4], [18, 220, 39.6]],
    checkout: { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutRates: [18, 18],
    matches: true
  }
];

cases.forEach(function (scenario) {
  test(scenario.name, function () {
    var order = { id: scenario.id, items: scenario.items, coupon: scenario.coupon };
    var actualInvoice = invoice.computeInvoiceFigures(order);
    var actualCheckout = pricing.computeTotals(order.items, order.coupon);

    // Literal expectations pin invoice figures and checkout agreement.
    var expectedRows = scenario.items.map(function (item, index) {
      var expected = scenario.rows[index];
      return {
        name: item.name,
        sku: '-',
        hsn: item.hsn,
        qty: item.qty,
        price: item.price,
        gstPercent: expected[0],
        line: expected[1],
        lineTax: expected[2]
      };
    });
    assert.deepStrictEqual(actualInvoice, Object.assign({}, scenario.invoice, { rows: expectedRows }));
    var checkoutSummary = Object.assign({}, actualCheckout);
    delete checkoutSummary.lines;
    assert.deepStrictEqual(checkoutSummary, scenario.checkout);
    assert.deepStrictEqual(actualCheckout.lines.map(function (line) {
      return line.gstPercent;
    }), scenario.checkoutRates);
    assert.strictEqual(actualInvoice.total === actualCheckout.total, scenario.matches);
    assert.strictEqual(actualInvoice.tax === actualCheckout.tax, scenario.matches);
  });
});

test('invoice matches checkout for mixed HSN slabs with capped SAVE10 before tax', function () {
  var items = [
    { id: 1, name: '5% oil', hsn: '1508', price: 1120, qty: 2 },
    { id: 2, name: '12% ghee', hsn: '0405', price: 450, qty: 1 },
    { id: 3, name: '18% tea', hsn: '0902', price: 140, qty: 2 }
  ];
  var order = { items: items, coupon: 'SAVE10' };
  var billed = pricing.computeTotals(items, order.coupon);
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual({
    subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
    cgst: billed.cgst, sgst: billed.sgst, total: billed.total
  }, { subtotal: 2970, discount: 150, tax: 205.46, cgst: 102.73, sgst: 102.73, total: 3025.46 });
  ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'].forEach(function (key) {
    assert.strictEqual(figures[key], billed[key], key + ' must match checkout');
  });
  assert.deepStrictEqual(figures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 5, lineTax: 106.34 },
    { gstPercent: 12, lineTax: 51.27 },
    { gstPercent: 18, lineTax: 47.85 }
  ]);
});
