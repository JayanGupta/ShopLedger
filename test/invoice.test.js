var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');

function sampleOrder(id, items, coupon) {
  return { id: id, items: items, coupon: coupon || '' };
}

function line(id, name, hsn, price, qty) {
  return { id: id, sku: 'SKU-' + id, name: name, hsn: hsn, price: price, qty: qty };
}

function assertFigures(order, expected) {
  var figures = invoice.computeInvoiceFigures(order);
  assert.equal(figures.subtotal, expected.subtotal);
  assert.equal(figures.discount, expected.discount);
  assert.equal(figures.tax, expected.tax);
  assert.equal(figures.total, expected.total);
  assert.deepEqual(figures.rows.map(function (row) { return row.gstPercent; }), expected.rates);
  assert.deepEqual(figures.rows.map(function (row) { return row.lineTax; }), expected.lineTaxes);
}

test('SAVE10 invoice matches checkout HSN tax and subtotal discount (order 1002)', function () {
  assertFigures(sampleOrder(1002, [
    line(1, 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
    line(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
  ], 'SAVE10'), {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9,
    rates: [5, 5],
    lineTaxes: [28.8, 17.1]
  });
});

test('SAVE10 invoice respects its discount cap (order 1004)', function () {
  assertFigures(sampleOrder(1004, [
    line(5, 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
  ], 'SAVE10'), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    rates: [5],
    lineTaxes: [104.5]
  });
});

test('invoice uses each line item HSN slab when no coupon is applied (order 1001)', function () {
  assertFigures(sampleOrder(1001, [
    line(8, 'Assam CTC Masala Chai 250g', '0902', 140, 2),
    line(2, 'Unpolished Toor Dal 1kg', '0713', 165, 2)
  ]), {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    total: 676.9,
    rates: [18, 5],
    lineTaxes: [50.4, 16.5]
  });
});

test('invoice uses 12% and 5% HSN slabs together (order 1007)', function () {
  assertFigures(sampleOrder(1007, [
    line(6, 'A2 Gir Cow Ghee 500ml', '0405', 450, 2),
    line(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
  ]), {
    subtotal: 1280,
    discount: 0,
    tax: 127,
    total: 1407,
    rates: [12, 5],
    lineTaxes: [108, 19]
  });
});

test('invoice remains aligned for an order that already reconciles (order 1008)', function () {
  assertFigures(sampleOrder(1008, [
    line(8, 'Assam CTC Masala Chai 250g', '0902', 140, 1),
    line(12, 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
  ]), {
    subtotal: 500,
    discount: 0,
    tax: 90,
    total: 590,
    rates: [18, 18],
    lineTaxes: [25.2, 64.8]
  });
});

test('rendered invoice shows the reconciled total without a mismatch notice', function () {
  var order = sampleOrder(1002, [
    line(1, 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
    line(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
  ], 'SAVE10');
  order.total = 963.9;
  var html = invoice.render(order);

  assert.match(html, /Invoice Total<\/td><td class="r">₹963\.90/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
