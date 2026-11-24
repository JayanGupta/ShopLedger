var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Use synthetic order lines. An undefined gstRate models a saved line with HSN alone.
var cases = [
  {
    name: '#1001 uses the 5% and 12% HSN slabs on the invoice',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, name: 'Rice', price: 90, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 2, name: 'Ghee', price: 260, qty: 2, hsn: '0405', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 610, discount: 0, tax: 66.90, cgst: 33.45, sgst: 33.45, total: 676.90 },
    invoiceLineGst: [{ gstPercent: 5, lineTax: 4.50 }, { gstPercent: 12, lineTax: 62.40 }],
    checkoutTotals: { subtotal: 610, discount: 0, tax: 66.90, cgst: 33.45, sgst: 33.45, total: 676.90 }
  },
  {
    name: '#1002 applies SAVE10 before calculating invoice GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 3, name: 'Dal', price: 190, qty: 2, hsn: '0713', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    invoiceLineGst: [{ gstPercent: 5, lineTax: 28.80 }, { gstPercent: 5, lineTax: 17.10 }],
    checkoutTotals: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 }
  },
  {
    name: '#1004 honors the SAVE10 cap on the invoice for a ₹2,240 order',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 4, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    invoiceLineGst: [{ gstPercent: 5, lineTax: 104.50 }],
    checkoutTotals: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 }
  },
  {
    name: '#1008 matches checkout for 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 5, name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
        { id: 6, name: 'Sherbet', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceLineGst: [{ gstPercent: 18, lineTax: 25.20 }, { gstPercent: 18, lineTax: 64.80 }],
    checkoutTotals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  }
];

function totals(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

cases.forEach(function (scenario) {
  test('CURRENT BEHAVIOUR: ' + scenario.name, function () {
    var order = scenario.order;
    var invoiceFigures = invoice.computeInvoiceFigures(order);
    var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(totals(invoiceFigures), scenario.invoiceTotals, 'printable invoice totals');
    assert.deepEqual(invoiceFigures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, lineTax: row.lineTax };
    }), scenario.invoiceLineGst, 'printable invoice GST per line');
    assert.deepEqual(totals(checkoutFigures), scenario.checkoutTotals, 'checkout totals for the same cart');
  });
});

test('invoice matches the billed totals and line GST for a mixed-slab order with capped SAVE10', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 240, qty: 4, hsn: '0405' }
    ]
  };
  var checkout = pricing.computeTotals(order.items, order.coupon);
  order.subtotal = checkout.subtotal;
  order.discount = checkout.discount;
  order.tax = checkout.tax;
  order.total = checkout.total;
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(figures), {
    subtotal: 2240, discount: 150, tax: 167.20, cgst: 83.60, sgst: 83.60, total: 2257.20
  });
  assert.deepEqual(totals(figures), totals(checkout));
  assert.deepEqual(figures.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 59.71], [12, 107.49]]);

  var html = invoice.render(order);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹59\.71<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">₹107\.49<\/td>/);
  assert.match(html, /<td>Invoice Total<\/td><td class="r">₹2257\.20<\/td>/);

  assert.match(html, /<td class="r">₹1194\.29<\/td><td class="r">5%<\/td>/);
  assert.match(html, /<td class="r">₹895\.71<\/td><td class="r">12%<\/td>/);

  var legacyOrder = {
    id: 1000,
    coupon: '',
    items: [{ name: 'Rice', price: 100, qty: 1, hsn: '1006' }],
    subtotal: 100,
    discount: 0,
    tax: 18,
    total: 118
  };
  var legacyHtml = invoice.render(legacyOrder);
  assert.match(legacyHtml, /<td class="r">18%<\/td><td class="r">₹18\.00<\/td>/);
  assert.match(legacyHtml, /<td>Invoice Total<\/td><td class="r">₹118\.00<\/td>/);
  var reconciliation = require('../lib/reports').getGstReconciliation({ orders: [legacyOrder] });
  assert.equal(reconciliation.mismatchCount, 0);

  var olderCouponOrder = Object.assign({}, order, { discount: 200, tax: 163.20, total: 2203.20 });
  var olderCouponHtml = invoice.render(olderCouponOrder);
  assert.match(olderCouponHtml, /<td>Invoice Total<\/td><td class="r">₹2203\.20<\/td>/);
  assert.match(olderCouponHtml, /<td class="r">—<\/td><td class="r">—<\/td><td class="r">—<\/td>/);
  assert.match(olderCouponHtml, /original line-level GST could not be verified/);
});
