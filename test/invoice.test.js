var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Checkout-style order lines leave gstRate undefined and carry the HSN instead.
function item(name, hsn, price, qty) {
  return { name: name, hsn: hsn, price: price, qty: qty, gstRate: undefined };
}

var cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-style mixed slabs match checkout',
    items: [item('Dal', '0713', 165, 2), item('Butter', '0405', 280, 1)],
    coupon: '',
    invoice: { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 },
    checkout: { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 },
    invoiceLines: [[5, 16.5], [12, 33.6]],
    checkoutLines: [[5, 16.5], [12, 33.6]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002-style SAVE10 reduces the invoice tax base',
    items: [item('Rice', '1006', 640, 1), item('Sunflower oil', '1512', 190, 2)],
    coupon: 'SAVE10',
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    invoiceLines: [[5, 28.8], [5, 17.1]],
    checkoutLines: [[5, 28.8], [5, 17.1]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004-style SAVE10 applies the 150-rupee invoice cap',
    items: [item('Groundnut oil', '1508', 1120, 2)],
    coupon: 'SAVE10',
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    invoiceLines: [[5, 104.5]],
    checkoutLines: [[5, 104.5]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008-style uncouponed 18% items match checkout',
    items: [item('Tea', '0902', 140, 1), item('Sherbet', '2106', 180, 2)],
    coupon: '',
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceLines: [[18, 25.2], [18, 64.8]],
    checkoutLines: [[18, 25.2], [18, 64.8]]
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

cases.forEach(function (scenario) {
  test(scenario.name, function () {
    var printed = invoice.computeInvoiceFigures({ items: scenario.items, coupon: scenario.coupon });
    var billed = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual(figures(printed), scenario.invoice, 'invoice figures');
    assert.deepEqual(figures(billed), scenario.checkout, 'checkout figures');
    assert.deepEqual(printed.rows.map(function (row) {
      return [row.gstPercent, row.lineTax];
    }), scenario.invoiceLines, 'invoice line GST');
    assert.deepEqual(billed.lines.map(function (line) {
      return [line.gstPercent, line.tax];
    }), scenario.checkoutLines, 'checkout line GST');
  });
});

test('invoice matches checkout for mixed GST slabs and capped SAVE10', function () {
  var items = [item('Rice', '1006', 640, 1), item('Butter', '0405', 400, 4)];
  var coupon = 'SAVE10';
  var billed = pricing.computeTotals(items, coupon);
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: coupon });

  assert.deepEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 209, cgst: 104.5, sgst: 104.5, total: 2299
  });
  assert.deepEqual(figures(printed), figures(billed), 'invoice figures must match checkout');
  assert.deepEqual(printed.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[5, 29.86], [12, 179.14]]);

  // An old coupon may no longer exist when the order is reprinted.
  var saved = Object.assign({ items: items, coupon: 'RETIRED' }, figures(billed));
  var historical = invoice.computeInvoiceFigures(saved);
  assert.deepEqual(figures(historical), figures(billed));
  assert.equal(historical.gstBreakdownAvailable, false);
  assert.deepEqual(historical.rows.map(function (row) {
    return [row.gstPercent, row.lineTax];
  }), [[null, null], [null, null]]);
  var html = invoice.render(saved);
  assert.match(html, /Line GST unavailable/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2299\.00/);
});
