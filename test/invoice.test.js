var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Synthetic orders model the workshop scenarios without loading persisted data.
// HSN-only fixtures intentionally omit gstRate; explicit-rate variants are separate.
var mixedOrder = {
  id: 1001,
  coupon: '',
  items: [
    { id: 1, name: 'Staple', sku: 'TEST-STAPLE', price: 90, qty: 1, hsn: '1006' },
    { id: 2, name: 'Butter', sku: 'TEST-BUTTER', price: 260, qty: 2, hsn: '0405' }
  ]
};

var couponOrder = {
  id: 1002,
  coupon: 'SAVE10',
  items: [
    { id: 1, name: 'Rice', sku: 'TEST-RICE', price: 640, qty: 1, hsn: '1006' },
    { id: 2, name: 'Oil', sku: 'TEST-OIL', price: 190, qty: 2, hsn: '1512' }
  ]
};

function withGstRates(order, rates) {
  return Object.assign({}, order, {
    items: order.items.map(function (item, index) {
      return Object.assign({}, item, { gstRate: rates[index] });
    })
  });
}

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

var cases = [
  {
    name: '#1001 resolves HSN-only 5% and 12% slabs',
    order: mixedOrder,
    invoice: {
      subtotal: 610, discount: 0, tax: 66.90,
      cgst: 33.45, sgst: 33.45, total: 676.90
    },
    checkout: {
      subtotal: 610, discount: 0, tax: 66.90,
      cgst: 33.45, sgst: 33.45, total: 676.90
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 90, lineTax: 4.50 },
      { hsn: '0405', gstPercent: 12, line: 520, lineTax: 62.40 }
    ],
    checkoutRates: [5, 12]
  },
  {
    name: '#1002 applies SAVE10 before HSN-based GST',
    order: couponOrder,
    invoice: {
      subtotal: 1020, discount: 102, tax: 45.90,
      cgst: 22.95, sgst: 22.95, total: 963.90
    },
    checkout: {
      subtotal: 1020, discount: 102, tax: 45.90,
      cgst: 22.95, sgst: 22.95, total: 963.90
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.80 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.10 }
    ],
    checkoutRates: [5, 5]
  },
  {
    name: '#1004 caps SAVE10 at INR 150 before GST',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 3, name: 'Groundnut oil', sku: 'TEST-BULK-OIL', price: 1120, qty: 2, hsn: '1508' }
      ]
    },
    invoice: {
      subtotal: 2240, discount: 150, tax: 104.50,
      cgst: 52.25, sgst: 52.25, total: 2194.50
    },
    checkout: {
      subtotal: 2240, discount: 150, tax: 104.50,
      cgst: 52.25, sgst: 52.25, total: 2194.50
    },
    invoiceRows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.50 }
    ],
    checkoutRates: [5]
  },
  {
    name: '#1008 all-18% items without a coupon match checkout',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 4, name: 'Tea', sku: 'TEST-TEA', price: 140, qty: 1, hsn: '0902' },
        { id: 5, name: 'Coffee', sku: 'TEST-COFFEE', price: 180, qty: 2, hsn: '0901' }
      ]
    },
    invoice: {
      subtotal: 500, discount: 0, tax: 90,
      cgst: 45, sgst: 45, total: 590
    },
    checkout: {
      subtotal: 500, discount: 0, tax: 90,
      cgst: 45, sgst: 45, total: 590
    },
    invoiceRows: [
      { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.20 },
      { hsn: '0901', gstPercent: 18, line: 360, lineTax: 64.80 }
    ],
    checkoutRates: [18, 18]
  },
  {
    name: '#1001 explicit percentage rates without a coupon match checkout',
    order: withGstRates(mixedOrder, [5, 12]),
    invoice: {
      subtotal: 610, discount: 0, tax: 66.90,
      cgst: 33.45, sgst: 33.45, total: 676.90
    },
    checkout: {
      subtotal: 610, discount: 0, tax: 66.90,
      cgst: 33.45, sgst: 33.45, total: 676.90
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 90, lineTax: 4.50 },
      { hsn: '0405', gstPercent: 12, line: 520, lineTax: 62.40 }
    ],
    checkoutRates: [5, 12]
  },
  {
    name: '#1002 explicit rates match checkout GST and discount as well as total',
    order: withGstRates(couponOrder, [5, 5]),
    invoice: {
      subtotal: 1020, discount: 102, tax: 45.90,
      cgst: 22.95, sgst: 22.95, total: 963.90
    },
    checkout: {
      subtotal: 1020, discount: 102, tax: 45.90,
      cgst: 22.95, sgst: 22.95, total: 963.90
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.80 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.10 }
    ],
    checkoutRates: [5, 5]
  },
  {
    name: '#1001 accepts decimal GST rates without dividing again',
    order: withGstRates(mixedOrder, [0.05, 0.12]),
    invoice: {
      subtotal: 610, discount: 0, tax: 66.90,
      cgst: 33.45, sgst: 33.45, total: 676.90
    },
    checkout: {
      subtotal: 610, discount: 0, tax: 66.90,
      cgst: 33.45, sgst: 33.45, total: 676.90
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, line: 90, lineTax: 4.50 },
      { hsn: '0405', gstPercent: 12, line: 520, lineTax: 62.40 }
    ],
    checkoutRates: [5, 12]
  }
];

cases.forEach(function (scenario) {
  test(scenario.name, function () {
    var order = scenario.order;
    var actualInvoice = invoice.computeInvoiceFigures(order);
    var actualCheckout = pricing.computeTotals(order.items, order.coupon);

    assert.deepStrictEqual(figures(actualInvoice), scenario.invoice, 'current invoice figures');
    assert.deepStrictEqual(figures(actualCheckout), scenario.checkout, 'checkout reference figures');
    assert.deepStrictEqual(actualInvoice.rows.map(function (row) {
      return {
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        line: row.line,
        lineTax: row.lineTax
      };
    }), scenario.invoiceRows, 'current invoice line amounts and GST');
    assert.deepStrictEqual(actualCheckout.lines.map(function (line) {
      return line.gstPercent;
    }), scenario.checkoutRates, 'checkout GST slabs for the same items');
  });
});

test('invoice matches checkout figures and per-line GST after coupons', function () {
  var orders = cases.map(function (scenario) {
    return scenario.order;
  }).concat([
    {
      id: 'flat-coupon',
      coupon: 'FLAT50',
      items: [
        { name: 'Butter', price: 260, qty: 2, hsn: '0405' },
        { name: 'Dal', price: 165, qty: 1, hsn: '0713' }
      ]
    },
    {
      id: 'rounding',
      coupon: 'WELCOME',
      items: [
        { name: 'Staple', price: 19.99, qty: 3, hsn: '1006' },
        { name: 'Dairy', price: 9.99, qty: 7, hsn: '0405' },
        { name: 'Tea', price: 2.49, qty: 4, hsn: '0902' }
      ]
    },
    { id: 'expired-coupon', coupon: 'DIWALI20', items: couponOrder.items },
    { id: 'below-minimum', coupon: 'SAVE10', items: [mixedOrder.items[0]] },
    {
      id: 'zero-rate',
      coupon: '',
      items: [{ name: 'Exempt item', price: 100, qty: 1, hsn: '1006', gstRate: 0 }]
    },
    { id: 'missing-items', coupon: '' }
  ]);

  orders.forEach(function (order) {
    var items = order.items || [];
    var billed = pricing.computeTotals(items, order.coupon);
    var actual = invoice.computeInvoiceFigures(order);

    assert.deepStrictEqual(figures(actual), figures(billed), 'order ' + order.id + ' billed figures');
    assert.strictEqual(actual.rows.length, items.length, 'order ' + order.id + ' line count');
    actual.rows.forEach(function (row, index) {
      var item = items[index];
      var line = billed.lines[index];
      assert.deepStrictEqual(row, {
        name: item.name,
        sku: item.sku || '-',
        hsn: item.hsn || '-',
        qty: item.qty,
        price: item.price,
        gstPercent: line.gstPercent,
        line: line.gross,
        lineTax: line.tax
      }, 'order ' + order.id + ' invoice row ' + index);
    });
  });
});
