var test = require('node:test');
var assert = require('node:assert/strict');

var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('customer can purchase exactly the remaining sellable quantity', function () {
  var products = [
    { id: 1, name: 'Single unit item', stock: 3, reserved: 2 }
  ];
  var items = [{ id: 1, qty: 1 }];

  assert.equal(inventory.getSellableStock(products[0]), 1);
  assert.deepEqual(inventory.check(products, items), { ok: true });
});

test('customer cannot purchase more than the remaining sellable quantity', function () {
  var products = [
    { id: 1, name: 'Single unit item', stock: 3, reserved: 2 }
  ];
  var items = [{ id: 1, qty: 2 }];

  assert.deepEqual(inventory.check(products, items), {
    ok: false,
    msg: 'Single unit item is out of stock (1 sellable available)'
  });
});

test('cancelling an order restores physical stock deducted at placement', function () {
  var products = [
    { id: 7, name: 'Staple', stock: 5, reserved: 0 }
  ];
  var items = [{ id: 7, qty: 2 }];
  var db = {
    products: products,
    orders: [],
    nextOrderId: 1001
  };

  inventory.reserve(products, items);
  assert.equal(products[0].stock, 3);

  var order = orders.add(db, {
    date: '21/11/2026',
    status: 'completed',
    paymentMode: 'cash',
    items: items,
    subtotal: 20,
    discount: 0,
    tax: 0,
    total: 20
  });
  var result = orders.cancel(db, order.id, 'test cancellation');

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.equal(products[0].stock, 5);
});

test('cancelling an already cancelled order does not restore stock twice', function () {
  var products = [
    { id: 7, name: 'Staple', stock: 5, reserved: 0 }
  ];
  var items = [{ id: 7, qty: 2 }];
  var db = {
    products: products,
    orders: [],
    nextOrderId: 1001
  };

  inventory.reserve(products, items);
  var order = orders.add(db, {
    date: '21/11/2026',
    status: 'completed',
    paymentMode: 'cash',
    items: items,
    subtotal: 20,
    discount: 0,
    tax: 0,
    total: 20
  });

  assert.equal(orders.cancel(db, order.id, 'first cancellation').ok, true);
  assert.equal(products[0].stock, 5);

  var secondResult = orders.cancel(db, order.id, 'second cancellation');
  assert.equal(secondResult.ok, false);
  assert.match(secondResult.error, /already cancelled/);
  assert.equal(products[0].stock, 5);
});
