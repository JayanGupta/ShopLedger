var assert = require('node:assert');
var test = require('node:test');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('inventory sells the final sellable unit and restores cancelled stock exactly once', function () {
  var line = {
    id: 3,
    sku: 'RICE-003',
    name: 'Rice Bag',
    hsn: '1006',
    price: 50,
    qty: 2
  };
  var db = {
    products: [{ id: 3, sku: 'RICE-003', name: 'Rice Bag', stock: 5, reserved: 1 }],
    customers: [],
    orders: [{
      id: 1001,
      date: '01/01/2022',
      customer: 'Walk-in',
      paymentMode: 'cash',
      status: 'pending',
      items: [line],
      total: 100
    }]
  };

  assert.deepStrictEqual(inventory.check([{ id: 9, name: 'Tea', stock: 1, reserved: 0 }], [{ id: 9, qty: 1 }]), { ok: true });
  assert.strictEqual(inventory.check([{ id: 9, name: 'Tea', stock: 1, reserved: 0 }], [{ id: 9, qty: 2 }]).ok, false);
  inventory.reserve(db.products, [line]);
  assert.strictEqual(db.products[0].stock, 3);
  assert.strictEqual(orders.cancel(db, 1001, 'Customer cancelled').ok, true);
  assert.deepStrictEqual({ stock: db.products[0].stock, reserved: db.products[0].reserved }, { stock: 5, reserved: 1 });
  assert.strictEqual(orders.cancel(db, 1001, 'Repeated cancellation').ok, false);
  assert.deepStrictEqual({ stock: db.products[0].stock, reserved: db.products[0].reserved }, { stock: 5, reserved: 1 });
});

test('inventory.check permits the final sellable unit, rejects an over-sale, and accepts zero quantity', function () {
  var products = [{ id: 1, name: 'Rice', stock: 1, reserved: 0 }];

  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 0 }]), { ok: true });
});

test('inventory.check permits one unit when stock four has three reserved', function () {
  var products = [{ id: 2, name: 'Ghee', stock: 4, reserved: 3 }];

  assert.strictEqual(inventory.getSellableStock(products[0]), 1);
  assert.deepStrictEqual(inventory.check(products, [{ id: 2, qty: 1 }]), { ok: true });
});

test('cancelling a route-shaped pending order restores physical stock', function () {
  var line = {
    id: 3,
    sku: 'RICE-003',
    name: 'Rice Bag',
    hsn: '1006',
    price: 50,
    qty: 2
  };
  var db = {
    products: [{ id: 3, sku: 'RICE-003', name: 'Rice Bag', stock: 5, reserved: 1 }],
    customers: [],
    orders: [{
      id: 1001,
      date: '01/01/2022',
      customer: 'Walk-in',
      paymentMode: 'cash',
      status: 'pending',
      items: [line],
      total: 100
    }]
  };

  assert.deepStrictEqual({ stock: db.products[0].stock, reserved: db.products[0].reserved }, { stock: 5, reserved: 1 });
  inventory.reserve(db.products, [line]);
  assert.deepStrictEqual({ stock: db.products[0].stock, reserved: db.products[0].reserved }, { stock: 3, reserved: 1 });

  var result = orders.cancel(db, 1001, 'Customer cancelled');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.order.status, 'cancelled');
  assert.deepStrictEqual({ stock: db.products[0].stock, reserved: db.products[0].reserved }, { stock: 5, reserved: 1 });
});
