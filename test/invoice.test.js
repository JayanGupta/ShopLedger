var test = require('node:test');
var assert = require('node:assert');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(name, price, qty, hsn) {
  return { name: name, price: price, qty: qty, hsn: hsn, gstRate: undefined };
}

function figures(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN GST slabs', function () {
  var result = figures({
    coupon: '',
    items: [line('Toor Dal', 165, 2, '0713'), line('Table Butter', 260, 1, '0405')]
  });

  assert.deepStrictEqual(result.invoice.rows.map(function (row) { return row.gstPercent; }), [5, 12]);
  assert.deepStrictEqual(result.invoice, {
    subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7,
    rows: result.invoice.rows
  });
  assert.deepStrictEqual(
    { tax: result.checkout.tax, total: result.checkout.total },
    { tax: 47.7, total: 637.7 }
  );
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before HSN GST', function () {
  var result = figures({
    coupon: 'SAVE10',
    items: [line('Basmati Rice', 640, 1, '1006'), line('Sunflower Oil', 190, 2, '1512')]
  });

  assert.deepStrictEqual(result.invoice.rows.map(function (row) { return row.gstPercent; }), [5, 5]);
  assert.deepStrictEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
  assert.deepStrictEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the ₹150 SAVE10 cap before 5% GST', function () {
  var result = figures({
    coupon: 'SAVE10',
    items: [line('Groundnut Oil', 1120, 2, '1508')]
  });

  assert.deepStrictEqual(result.invoice.rows.map(function (row) { return row.gstPercent; }), [5]);
  assert.deepStrictEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
  assert.deepStrictEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 all-18% no-coupon invoice agrees with checkout', function () {
  var result = figures({
    coupon: '',
    items: [line('Masala Chai', 140, 2, '0902'), line('Coffee Blend', 310, 1, '0901')]
  });

  assert.deepStrictEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 590, discount: 0, tax: 106.2, total: 696.2 }
  );
  assert.deepStrictEqual(
    { tax: result.checkout.tax, total: result.checkout.total },
    { tax: result.invoice.tax, total: result.invoice.total }
  );
});

test('CURRENT BEHAVIOUR: invoice matches checkout for capped SAVE10 before per-line HSN GST', function () {
  var result = figures({
    coupon: 'SAVE10',
    items: [line('Groundnut Oil', 1120, 2, '1508')]
  });

  assert.deepStrictEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [{
      name: 'Groundnut Oil', sku: '-', hsn: '1508', qty: 2, price: 1120,
      gstPercent: 5, line: 2240, lineTax: 104.5
    }]
  });
  assert.deepStrictEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total }
  );
});
