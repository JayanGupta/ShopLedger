var test = require('node:test');
var assert = require('node:assert').strict;
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var coupons = require('../lib/coupons');

// The first three cases use HSN codes without a saved gstRate, as checkout does.
var cases = [
  {
    name: '#1001 invoice uses the 5% and 12% HSN slabs',
    order: {
      id: 1001,
      items: [
        { id: 1, name: 'Dal', price: 110, qty: 3, hsn: '0713' },
        { id: 2, name: 'Ghee', price: 280, qty: 1, hsn: '0405' }
      ],
      coupon: ''
    },
    invoice: {
      subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10,
      rows: [
        { gstPercent: 5, line: 330, lineTax: 16.50 },
        { gstPercent: 12, line: 280, lineTax: 33.60 }
      ]
    },
    checkout: {
      subtotal: 610, discount: 0, taxable: 610, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10,
      lines: [
        { gstPercent: 5, discount: 0, tax: 16.50 },
        { gstPercent: 12, discount: 0, tax: 33.60 }
      ]
    }
  },
  {
    name: '#1002 invoice applies SAVE10 before GST',
    order: {
      id: 1002,
      items: [
        { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' },
        { id: 4, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
      ],
      coupon: 'SAVE10'
    },
    invoice: {
      subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
      rows: [
        { gstPercent: 5, line: 640, lineTax: 28.80 },
        { gstPercent: 5, line: 380, lineTax: 17.10 }
      ]
    },
    checkout: {
      subtotal: 1020, discount: 102, taxable: 918, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
      lines: [
        { gstPercent: 5, discount: 64, tax: 28.80 },
        { gstPercent: 5, discount: 38, tax: 17.10 }
      ]
    }
  },
  {
    name: '#1004 invoice honours the ₹150 SAVE10 cap',
    order: {
      id: 1004,
      items: [{ id: 5, name: 'Groundnut oil', price: 280, qty: 8, hsn: '1508' }],
      coupon: 'SAVE10'
    },
    invoice: {
      subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
      rows: [{ gstPercent: 5, line: 2240, lineTax: 104.50 }]
    },
    checkout: {
      subtotal: 2240, discount: 150, taxable: 2090, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
      lines: [{ gstPercent: 5, discount: 150, tax: 104.50 }]
    }
  },
  {
    name: '#1008 invoice matches checkout for 18% items without a coupon',
    order: {
      id: 1008,
      items: [
        { id: 8, name: 'Tea', price: 150, qty: 2, hsn: '0902', gstRate: 18 },
        { id: 12, name: 'Syrup', price: 200, qty: 1, hsn: '2106' }
      ],
      coupon: ''
    },
    invoice: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { gstPercent: 18, line: 300, lineTax: 54 },
        { gstPercent: 18, line: 200, lineTax: 36 }
      ]
    },
    checkout: {
      subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590,
      lines: [
        { gstPercent: 18, discount: 0, tax: 54 },
        { gstPercent: 18, discount: 0, tax: 36 }
      ]
    }
  }
];

cases.forEach(function (scenario) {
  test(scenario.name, function () {
    var order = scenario.order;
    var invoiceFigures = invoice.computeInvoiceFigures(order);
    var checkoutTotals = pricing.computeTotals(order.items, order.coupon);

    invoiceFigures.rows = invoiceFigures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    });
    checkoutTotals.lines = checkoutTotals.lines.map(function (line) {
      return { gstPercent: line.gstPercent, discount: line.discount, tax: line.tax };
    });

    assert.deepStrictEqual(invoiceFigures, scenario.invoice, 'invoice figures');
    assert.deepStrictEqual(checkoutTotals, scenario.checkout, 'checkout figures');
  });
});

test('printable invoice matches checkout for mixed GST slabs and capped SAVE10', function (t) {
  var items = [
    { id: 1, name: 'Rice', price: 640, qty: 2, hsn: '1006' },
    { id: 6, name: 'Ghee', price: 480, qty: 2, hsn: '0405' }
  ];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var order = {
    id: 2001,
    items: items,
    coupon: 'SAVE10',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    { subtotal: 2240, discount: 150, tax: 167.20, cgst: 83.60, sgst: 83.60, total: 2257.20 }
  );
  assert.deepStrictEqual(
    figures.rows.map(function (row) { return [row.taxable, row.gstPercent, row.lineTax]; }),
    [[1194.29, 5, 59.71], [895.71, 12, 107.49]]
  );

  var html = invoice.render(order);
  assert.match(html, /<td class="r">₹1194\.29<\/td><td class="r">5%<\/td><td class="r">₹59\.71<\/td>/);
  assert.match(html, /<td class="r">₹895\.71<\/td><td class="r">12%<\/td><td class="r">₹107\.49<\/td>/);
  assert.match(html, /Gross Subtotal<\/td><td class="r">₹2240\.00<\/td>/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹167\.20<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2257\.20<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  t.mock.method(coupons, 'getCoupon', function () { return null; });
  assert.strictEqual(pricing.computeTotals(items, order.coupon).discount, 0);
  assert.deepStrictEqual(invoice.computeInvoiceFigures(order), figures, 'saved invoice after coupon retirement');
  assert.strictEqual(invoice.render(order), html);
});
