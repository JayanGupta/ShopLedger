var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

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

test('#1001 invoice uses the checkout GST slabs for each HSN', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 300, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 400, qty: 1, hsn: '0405' }
    ]
  };

  // These order lines carry HSN but no explicit gstRate.
  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 1000, discount: 0, tax: 78, cgst: 39, sgst: 39, total: 1078
  });
  assert.deepEqual(printed.rows.map(function (row) { return row.gstPercent; }), [5, 12]);
  assert.deepEqual(printed.rows.map(function (row) { return row.lineTax; }), [30, 48]);
  assert.deepEqual(figures(printed), figures(checkout));
});

test('#1002 invoice applies SAVE10 before GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Packaged tea', price: 500, qty: 2, hsn: '0902' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062
  });
  assert.equal(printed.rows[0].lineTax, 162);
  assert.deepEqual(figures(printed), figures(checkout));
});

test('#1004 invoice honours the SAVE10 cap on a ₹2,240 subtotal', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Coffee', price: 560, qty: 4, hsn: '0901' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20
  });
  assert.equal(printed.rows[0].lineTax, 376.20);
  assert.deepEqual(figures(printed), figures(checkout));
});

test('#1008 invoice and checkout agree for 18% GST without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Packaged tea', price: 125, qty: 2, hsn: '0902', gstRate: 18 },
      { name: 'Coffee', price: 350, qty: 1, hsn: '0901' }
    ]
  };

  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 600, discount: 0, tax: 108, cgst: 54, sgst: 54, total: 708
  });
  assert.deepEqual(printed.rows.map(function (row) { return row.gstPercent; }), [18, 18]);
  assert.deepEqual(printed.rows.map(function (row) { return row.lineTax; }), [45, 63]);
  assert.deepEqual(figures(checkout), figures(printed));
});

test('invoice matches checkout for mixed GST slabs and a capped SAVE10 coupon', function () {
  var order = {
    coupon: 'SAVE10',
    total: 2267.65,
    items: [
      { name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
    ]
  };

  var checkout = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures(printed), {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65
  });
  assert.deepEqual(figures(printed), figures(checkout));
  assert.deepEqual(printed.rows.map(function (row) {
    return { rate: row.gstPercent, tax: row.lineTax };
  }), [
    { rate: 5, tax: 52.25 },
    { rate: 12, tax: 125.40 }
  ]);

  var html = invoice.render(order);
  assert.match(html, /<td>Gross Subtotal<\/td><td class="r">₹2240\.00<\/td>/);
  assert.match(html, /<td>CGST \+ SGST \(Total GST\)<\/td><td class="r">₹177\.65<\/td>/);
  assert.match(html, /<td>Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.match(html, /<td>Invoice Total<\/td><td class="r">₹2267\.65<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
