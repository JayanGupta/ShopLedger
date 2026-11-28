var test = require('node:test');
var assert = require('node:assert').strict;
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

function productWith(stock, reserved) {
  return { id: 1, sku: 'PEN', name: 'Pen', hsn: '9608', price: 10, stock: stock, reserved: reserved };
}

function lineItem(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: qty
  };
}

function check(product, qty) {
  return inventory.check([product], [lineItem(product, qty)]);
}

test('check accepts the last sellable unit', function () {
  assert.deepEqual(check(productWith(1, 0), 1), { ok: true });
});

test('check rejects two units when one is sellable', function () {
  assert.deepEqual(check(productWith(1, 0), 2), {
    ok: false,
    msg: 'Pen is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts zero units', function () {
  assert.deepEqual(check(productWith(1, 0), 0), { ok: true });
});

test('check allows one of four units when three are reserved', function () {
  var product = productWith(4, 3);
  assert.deepEqual(check(product, 1), { ok: true });
  assert.deepEqual(check(product, 2), {
    ok: false,
    msg: 'Pen is out of stock (1 sellable available)'
  });
});

test('cancelling a pending order restores stock and preserves reserved units', function () {
  var product = productWith(4, 3);
  var db = { products: [product], orders: [] };
  var items = [lineItem(product, 1)];

  function stockCounts() {
    return { stock: db.products[0].stock, reserved: db.products[0].reserved };
  }

  assert.deepEqual(stockCounts(), { stock: 4, reserved: 3 }, 'before order');
  inventory.reserve(db.products, items);
  assert.deepEqual(stockCounts(), { stock: 3, reserved: 3 }, 'after reserve');

  db.orders.push({ id: 1001, status: 'pending', paymentMode: 'cash', items: items });
  var result = orders.cancel(db, 1001, 'Customer request');
  assert.equal(result.ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.deepEqual(stockCounts(), { stock: 4, reserved: 3 }, 'after cancel');
});

test('an order can take all sellable units across lines and return them only once', function () {
  var product = productWith(5, 3);
  var db = { products: [product], orders: [] };
  var items = [lineItem(product, 1), lineItem(product, 1)];

  assert.equal(inventory.check(db.products, items.concat(lineItem(product, 1))).ok, false,
    'three lines must not exceed the two sellable units');
  assert.equal(inventory.check(db.products, items).ok, true);
  inventory.reserve(db.products, items);
  assert.equal(product.stock, 3);
  db.orders.push({ id: 1001, status: 'pending', paymentMode: 'cash', items: items });

  assert.equal(orders.cancel(db, 1001).ok, true);
  assert.equal(product.stock, 5);
  assert.equal(orders.cancel(db, 1001).ok, false);
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 3);
});
