var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('allows the last sellable unit and restores cancelled order stock exactly once', function () {
  var db = {
    nextOrderId: 1,
    products: [{ id: 1, stock: 3, reserved: 1 }],
    orders: []
  };
  var items = [{ id: 1, qty: 2 }];

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  assert.equal(db.products[0].stock, 1);

  var order = orders.add(db, { items: items });
  assert.equal(orders.cancel(db, order.id, 'test cancellation').ok, true);
  assert.equal(db.products[0].stock, 3);
  assert.equal(orders.cancel(db, order.id, 'repeat cancellation').ok, false);
  assert.equal(db.products[0].stock, 3);
});
