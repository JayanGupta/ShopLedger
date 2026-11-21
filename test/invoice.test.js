var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Checkout saves the HSN on each order line and leaves gstRate unset.
var cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice uses the billed 5% and 12% GST slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Pulses', price: 90, qty: 1, hsn: '0713', gstRate: undefined },
        { name: 'Ghee', price: 260, qty: 2, hsn: '0405', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 },
    invoiceGst: [{ gstPercent: 5, lineTax: 4.5 }, { gstPercent: 12, lineTax: 62.4 }],
    checkoutTotals: { subtotal: 610, discount: 0, taxable: 610, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 },
    checkoutGst: [{ gstPercent: 5, lineTax: 4.5 }, { gstPercent: 12, lineTax: 62.4 }]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    invoiceGst: [{ gstPercent: 5, lineTax: 28.8 }, { gstPercent: 5, lineTax: 17.1 }],
    checkoutTotals: { subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutGst: [{ gstPercent: 5, lineTax: 28.8 }, { gstPercent: 5, lineTax: 17.1 }]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap on a 2240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Bulk rice', price: 560, qty: 4, hsn: '1006', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    invoiceGst: [{ gstPercent: 5, lineTax: 104.5 }],
    checkoutTotals: { subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutGst: [{ gstPercent: 5, lineTax: 104.5 }]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 invoice matches checkout for all 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', price: 160, qty: 2, hsn: '0902', gstRate: undefined },
        { name: 'Coffee', price: 180, qty: 1, hsn: '0901', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceGst: [{ gstPercent: 18, lineTax: 57.6 }, { gstPercent: 18, lineTax: 32.4 }],
    checkoutTotals: { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutGst: [{ gstPercent: 18, lineTax: 57.6 }, { gstPercent: 18, lineTax: 32.4 }]
  }
];

cases.forEach(function (scenario) {
  test(scenario.name, function () {
    var order = scenario.order;
    var { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
    var { lines, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(invoiceTotals, scenario.invoiceTotals, 'invoice totals and GST split');
    assert.deepEqual(rows.map(function (row) {
      return { gstPercent: row.gstPercent, lineTax: row.lineTax };
    }), scenario.invoiceGst, 'invoice GST per line');

    assert.deepEqual(checkoutTotals, scenario.checkoutTotals, 'billed totals and GST split');
    assert.deepEqual(lines.map(function (line) {
      return { gstPercent: line.gstPercent, lineTax: line.tax };
    }), scenario.checkoutGst, 'billed GST per line');
  });
});

test('invoice matches checkout for mixed GST slabs with a capped coupon', function () {
  var order = {
    id: 2001,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 620, qty: 2, hsn: '0405' }
    ]
  };
  var { lines, taxable, ...billed } = pricing.computeTotals(order.items, order.coupon);
  Object.assign(order, billed);
  var { rows, ...printed } = invoice.computeInvoiceFigures(order);

  assert.equal(taxable, 2090);
  assert.equal(billed.discount, 150);
  assert.deepEqual(printed, billed);
  assert.deepEqual(rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), lines.map(function (line) {
    return { gstPercent: line.gstPercent, lineTax: line.tax };
  }));
  assert.match(invoice.render(order), /Invoice Total<\/td><td class="r">₹2275\.49<\/td>/);

  // Model the same items billed when SAVE10 had a different cap.
  var historicalOrder = Object.assign({}, order, { discount: 100, tax: 189.93, total: 2329.93 });
  var historicalInvoice = invoice.render(historicalOrder);
  assert.match(historicalInvoice, /Gross Subtotal<\/td><td class="r">₹2240\.00<\/td>/);
  assert.match(historicalInvoice, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹100\.00<\/td>/);
  assert.match(historicalInvoice, /Total GST\)<\/td><td class="r">₹189\.93<\/td>/);
  assert.match(historicalInvoice, /Invoice Total<\/td><td class="r">₹2329\.93<\/td>/);
  assert.match(historicalInvoice, /Accountant Reconciliation Notice/);
});
