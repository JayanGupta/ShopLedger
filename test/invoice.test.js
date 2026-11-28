var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

function item(id, name, hsn, price, qty) {
  return {
    id: id,
    name: name,
    hsn: hsn,
    price: price,
    qty: qty
  };
}

function orderFrom(items, coupon) {
  var totals = pricing.computeTotals(items, coupon || '');
  return {
    id: 9001,
    items: items,
    coupon: coupon || '',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('CURRENT BEHAVIOUR: checkout uses HSN slabs while printable invoice uses default GST for HSN-only mixed-rate items', function () {
  var items = [
    item(1, 'Rice', '1006', 100, 2),
    item(2, 'Ghee', '0405', 100, 1),
    item(3, 'Tea', '0902', 100, 1)
  ];
  var checkout = pricing.computeTotals(items, '');
  var printable = invoice.computeInvoiceFigures(orderFrom(items));

  assert.deepEqual(checkout.lines.map(function (line) { return line.gstPercent; }), [5, 12, 18]);
  assert.equal(checkout.subtotal, 400);
  assert.equal(checkout.tax, 40);
  assert.equal(checkout.total, 440);

  assert.deepEqual(printable.rows.map(function (line) { return line.gstPercent; }), [18, 18, 18]);
  assert.equal(printable.tax, 72);
  assert.equal(printable.total, 472);
  assert.equal(printable.total - checkout.total, 32);
});

test('CURRENT BEHAVIOUR: capped percentage coupon is capped before checkout GST but invoice discounts tax-inclusive amount without the cap', function () {
  var items = [
    item(1, 'Rice', '1006', 1000, 1),
    item(2, 'Ghee', '0405', 1000, 1)
  ];
  var checkout = pricing.computeTotals(items, 'SAVE10');
  var printable = invoice.computeInvoiceFigures(orderFrom(items, 'SAVE10'));

  assert.equal(checkout.subtotal, 2000);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 157.25);
  assert.equal(checkout.total, 2007.25);

  assert.equal(printable.tax, 360);
  assert.equal(printable.discount, 236);
  assert.equal(printable.total, 2124);
  assert.equal(printable.total - checkout.total, 116.75);
});

test('CURRENT BEHAVIOUR: flat coupon is applied before HSN GST at checkout and after default GST on the printable invoice', function () {
  var items = [
    item(1, 'Rice', '1006', 200, 1),
    item(2, 'Ghee', '0405', 200, 1)
  ];
  var checkout = pricing.computeTotals(items, 'FLAT50');
  var printable = invoice.computeInvoiceFigures(orderFrom(items, 'FLAT50'));

  assert.equal(checkout.subtotal, 400);
  assert.equal(checkout.discount, 50);
  assert.equal(checkout.tax, 29.75);
  assert.equal(checkout.total, 379.75);

  assert.equal(printable.tax, 72);
  assert.equal(printable.discount, 50);
  assert.equal(printable.total, 422);
  assert.equal(printable.total - checkout.total, 42.25);
});

test('CURRENT BEHAVIOUR: inactive coupon is ignored at checkout but still reduces the printable invoice total', function () {
  var items = [item(1, 'Rice', '1006', 500, 1)];
  var checkout = pricing.computeTotals(items, 'DIWALI20');
  var printable = invoice.computeInvoiceFigures(orderFrom(items, 'DIWALI20'));

  assert.equal(checkout.discount, 0);
  assert.equal(checkout.tax, 25);
  assert.equal(checkout.total, 525);

  assert.equal(printable.tax, 90);
  assert.equal(printable.discount, 118);
  assert.equal(printable.total, 472);
  assert.equal(printable.total - checkout.total, -53);
});
