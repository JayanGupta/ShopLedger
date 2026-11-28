var test = require('node:test');
var assert = require('node:assert').strict;
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

var cases = [
  {
    name: '#1001 uses the 5% and 12% HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 940, discount: 0, tax: 68, cgst: 34, sgst: 34, total: 1008 },
    invoiceRows: [[5, 640, 32], [12, 300, 36]],
    checkout: { discount: 0, tax: 68, total: 1008 }
  },
  {
    name: '#1002 applies SAVE10 before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Tea', price: 500, qty: 1, hsn: '0902', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 500, discount: 50, tax: 81, cgst: 40.5, sgst: 40.5, total: 531 },
    invoiceRows: [[18, 500, 81]],
    checkout: { discount: 50, tax: 81, total: 531 }
  },
  {
    name: '#1004 applies the SAVE10 cap on a 2240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 560, qty: 4, hsn: '1006', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    invoiceRows: [[5, 2240, 104.5]],
    checkout: { discount: 150, tax: 104.5, total: 2194.5 }
  },
  {
    name: '#1008 matches checkout for 18% lines without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', price: 240, qty: 2, hsn: '0902', gstRate: 18 },
        { name: 'Coffee', price: 320, qty: 1, hsn: '0901', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 800, discount: 0, tax: 144, cgst: 72, sgst: 72, total: 944 },
    invoiceRows: [[18, 480, 86.4], [18, 320, 57.6]],
    checkout: { discount: 0, tax: 144, total: 944 }
  }
];

cases.forEach(function (scenario) {
  test('CURRENT BEHAVIOUR: ' + scenario.name, function () {
    var order = scenario.order;
    var { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
    var { discount, tax, total } = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(invoiceTotals, scenario.invoiceTotals);
    assert.deepEqual(rows.map(function (row) {
      return [row.gstPercent, row.line, row.lineTax];
    }), scenario.invoiceRows);
    assert.deepEqual({ discount, tax, total }, scenario.checkout);
  });
});

test('invoice matches checkout for mixed HSN slabs and a capped SAVE10 coupon', function () {
  var items = [
    { name: 'Rice', price: 800, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 640, qty: 1, hsn: '0405' }
  ];
  var coupon = 'SAVE10';
  var checkout = pricing.computeTotals(items, coupon);
  var { rows, ...totals } = invoice.computeInvoiceFigures({ items, coupon });

  assert.deepEqual({ subtotal: checkout.subtotal, discount: checkout.discount }, {
    subtotal: 2240,
    discount: 150
  });
  assert.deepEqual(totals, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  });
  assert.deepEqual(rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 74.64], [12, 71.66]]);
});
