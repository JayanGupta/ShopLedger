var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');
var seed = require('../data/db.json');

test('last sellable units can be sold without using wholesale reservations', function () {
  [6, 11].forEach(function (id) {
    var product = Object.assign({}, seed.products.find(function (p) { return p.id === id; }));
    var items = [{ id: id, qty: 1 }];
    assert.equal(inventory.check([product], items).ok, true);
    inventory.reserve([product], items);
    assert.equal(product.stock, product.reserved);
    assert.equal(inventory.check([product], items).ok, false);
  });
});

test('duplicate cart lines cannot collectively exceed sellable stock', function () {
  var products = [{ id: 1, stock: 5, reserved: 2 }];
  assert.equal(inventory.check(products, [{ id: 1, qty: 2 }, { id: 1, qty: 2 }]).ok, false);
  assert.equal(inventory.check(products, [{ id: 1, qty: 1 }, { id: 1, qty: 2 }]).ok, true);
  assert.equal(products[0].stock, 5);
});

test('cancelling a pending Khata order restores physical stock and reverses credit exactly once', function () {
  var db = JSON.parse(JSON.stringify(seed));
  var before = db.products.map(function (p) { return { stock: p.stock, reserved: p.reserved }; });
  assert.equal(orders.cancel(db, 1007).ok, true);
  db.products.forEach(function (p, i) {
    assert.equal(p.stock, before[i].stock + (p.id === 6 || p.id === 4 ? 2 : 0));
    assert.equal(p.reserved, before[i].reserved);
  });
  assert.equal(db.customers.find(function (c) { return c.id === 4; }).balance, 200);
  var after = JSON.stringify(db);
  assert.equal(orders.cancel(db, 1007).ok, false);
  assert.equal(JSON.stringify(db), after);
});
