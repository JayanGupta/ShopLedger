var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function amounts(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

function assertFigures(order, expectedInvoice, expectedCheckout) {
  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(printed), expectedInvoice.amounts, 'invoice amounts');
  assert.deepEqual(amounts(checkout), expectedCheckout.amounts, 'checkout amounts');
  assert.deepEqual(printed.rows.map(function (row) {
    return { hsn: row.hsn, gstPercent: row.gstPercent, tax: row.lineTax };
  }), expectedInvoice.gst, 'invoice line GST');
  assert.deepEqual(checkout.lines.map(function (line) {
    return { hsn: line.hsn, gstPercent: line.gstPercent, tax: line.tax };
  }), expectedCheckout.gst, 'checkout line GST');
}

// Checkout order lines carry HSN and omit gstRate.
test('#1001-style invoice applies the 5% and 12% HSN slabs', function () {
  var order = {
    coupon: '',
    items: [
      { name: 'Dal', hsn: '0713', price: 165, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 400, qty: 1 }
    ]
  };
  var expected = {
    amounts: { subtotal: 730, discount: 0, tax: 64.5, cgst: 32.25, sgst: 32.25, total: 794.5 },
    gst: [
      { hsn: '0713', gstPercent: 5, tax: 16.5 },
      { hsn: '0405', gstPercent: 12, tax: 48 }
    ]
  };

  assertFigures(order, expected, expected);
});

test('#1002-style invoice applies SAVE10 before GST', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ]
  };
  var expected = {
    amounts: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    gst: [
      { hsn: '1006', gstPercent: 5, tax: 28.8 },
      { hsn: '1512', gstPercent: 5, tax: 17.1 }
    ]
  };

  assertFigures(order, expected, expected);
});

test('#1004-style invoice applies the SAVE10 cap', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', hsn: '1508', price: 280, qty: 8 }
    ]
  };
  var expected = {
    amounts: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    gst: [{ hsn: '1508', gstPercent: 5, tax: 104.5 }]
  };

  assertFigures(order, expected, expected);
});

test('#1008-style invoice matches checkout with all 18% items and no coupon', function () {
  var expected = {
    amounts: { subtotal: 530, discount: 0, tax: 95.4, cgst: 47.7, sgst: 47.7, total: 625.4 },
    gst: [
      { hsn: '0902', gstPercent: 18, tax: 50.4 },
      { hsn: '2106', gstPercent: 18, tax: 45 }
    ]
  };

  assertFigures({
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 140, qty: 2 },
      { name: 'Syrup', hsn: '2106', price: 250, qty: 1, gstRate: 18 }
    ]
  }, expected, expected);
});

test('invoice matches checkout for mixed GST slabs with a capped SAVE10 discount', function () {
  var expected = {
    amounts: { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 },
    gst: [
      { hsn: '1006', gstPercent: 5, tax: 52.25 },
      { hsn: '0405', gstPercent: 12, tax: 125.4 }
    ]
  };

  var order = {
    id: 2001,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 560, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 1120, qty: 1 }
    ]
  };
  assertFigures(order, expected, expected);

  Object.assign(order, pricing.computeTotals(order.items, order.coupon));
  var html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2267\.65/);
  assert.match(html, /₹1045\.00<\/td><td class="r">12%<\/td><td class="r">₹125\.40/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  // Simulate a reprint after the original coupon definition is no longer available.
  order.coupon = 'REMOVED_SAVE10';
  html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2267\.65/);
  assert.match(html, /Total GST\)<\/td><td class="r">₹177\.65/);
  assert.match(html, /Accountant Reconciliation Notice/);
  assert.doesNotMatch(html, />12%<\/td>/);
});
