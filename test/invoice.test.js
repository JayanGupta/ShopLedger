var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return {
    name: name,
    price: price,
    qty: qty,
    hsn: hsn,
    gstRate: gstRate
  };
}

function calculate(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 computes 5% and 12% GST without a coupon', function () {
  var order = {
    coupon: '',
    items: [
      item('5% goods', 90, 1, '1006', 5),
      item('12% goods', 260, 2, '0405', 12)
    ]
  };
  var figures = calculate(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: '5% goods', sku: '-', hsn: '1006', qty: 1, price: 90, gstPercent: 5, line: 90, lineTax: 4.5 },
      { name: '12% goods', sku: '-', hsn: '0405', qty: 2, price: 260, gstPercent: 12, line: 520, lineTax: 62.4 }
    ]
  });
  assert.equal(figures.checkout.total, 676.9);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 discounts before invoice GST', function () {
  var order = {
    coupon: 'SAVE10',
    items: [item('5% goods', 1020, 1, '1512', 5)]
  };
  var figures = calculate(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: '5% goods', sku: '-', hsn: '1512', qty: 1, price: 1020, gstPercent: 5, line: 1020, lineTax: 45.9 }
    ]
  });
  assert.equal(figures.checkout.discount, 102);
  assert.equal(figures.checkout.tax, 45.9);
  assert.equal(figures.checkout.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 invoice respects SAVE10 maximum discount cap', function () {
  var order = {
    coupon: 'SAVE10',
    items: [item('5% goods', 2240, 1, '1508', 5)]
  };
  var figures = calculate(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: '5% goods', sku: '-', hsn: '1508', qty: 1, price: 2240, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(figures.checkout.discount, 150);
  assert.equal(figures.checkout.tax, 104.5);
  assert.equal(figures.checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree for an 18% order without coupon', function () {
  var order = {
    coupon: '',
    items: [item('18% goods', 500, 1, '0902', 18)]
  };
  var figures = calculate(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: '18% goods', sku: '-', hsn: '0902', qty: 1, price: 500, gstPercent: 18, line: 500, lineTax: 90 }
    ]
  });
  assert.equal(figures.checkout.total, 590);
});

test('invoice matches checkout totals when SAVE10 reaches its discount cap', function () {
  var order = {
    coupon: 'SAVE10',
    items: [item('5% goods', 2240, 1, '1508', 5)]
  };
  var figures = calculate(order);

  assert.equal(figures.invoice.subtotal, figures.checkout.subtotal);
  assert.equal(figures.invoice.discount, figures.checkout.discount);
  assert.equal(figures.invoice.tax, figures.checkout.tax);
  assert.equal(figures.invoice.total, figures.checkout.total);
});

// Stored order lines carry HSN (not gstRate); invoice must still match checkout.
test('invoice matches checkout for HSN-only lines shaped like stored orders', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
    ]
  };
  var figures = calculate(order);

  assert.equal(figures.invoice.subtotal, figures.checkout.subtotal);
  assert.equal(figures.invoice.discount, figures.checkout.discount);
  assert.equal(figures.invoice.tax, figures.checkout.tax);
  assert.equal(figures.invoice.cgst, figures.checkout.cgst);
  assert.equal(figures.invoice.sgst, figures.checkout.sgst);
  assert.equal(figures.invoice.total, figures.checkout.total);
  assert.equal(figures.invoice.total, 963.9);
  assert.equal(figures.invoice.rows[0].gstPercent, 5);
  assert.equal(figures.invoice.rows[1].gstPercent, 5);
});
