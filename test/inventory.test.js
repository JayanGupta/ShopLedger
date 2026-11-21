var test = require('node:test');
var assert = require('node:assert/strict');

var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

function item(id, qty) {
  return { id: id, qty: qty };
}

test('CURRENT BEHAVIOUR: check accepts qty 1 when exactly one unit is sellable', function () {
  var products = [{ id: 1, name: 'Last unit', stock: 1, reserved: 0 }];

  assert.deepEqual(inventory.check(products, [item(1, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when exactly one unit is sellable', function () {
  var products = [{ id: 1, name: 'Last unit', stock: 1, reserved: 0 }];

  assert.deepEqual(inventory.check(products, [item(1, 2)]), {
    ok: false,
    msg: 'Last unit is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when exactly one unit is sellable', function () {
  var products = [{ id: 1, name: 'Last unit', stock: 1, reserved: 0 }];

  assert.deepEqual(inventory.check(products, [item(1, 0)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check accepts the last sellable unit after reservations', function () {
  var products = [{ id: 2, name: 'Reserved stock', stock: 4, reserved: 3 }];

  assert.equal(inventory.getSellableStock(products[0]), 1);
  assert.deepEqual(inventory.check(products, [item(2, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: reserve deducts stock and cancel restores stock once', function () {
  var product = {
    id: 7,
    sku: 'SKU-007',
    name: 'In-memory product',
    hsn: '1006',
    price: 25,
    stock: 5,
    reserved: 2
  };
  // This shape matches the line items constructed in routes/orders.js.
  var orderItem = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 1
  };
  var db = {
    products: [product],
    orders: [{
      id: 101,
      paymentMode: 'cash',
      status: 'pending',
      items: [orderItem],
      total: 25
    }],
    customers: []
  };
  var beforeOrder = { stock: product.stock, reserved: product.reserved };

  inventory.reserve(db.products, [orderItem]);
  var afterReserve = { stock: product.stock, reserved: product.reserved };

  var cancelled = orders.cancel(db, 101, 'Characterization test');
  var afterCancel = { stock: product.stock, reserved: product.reserved };

  assert.deepEqual(beforeOrder, { stock: 5, reserved: 2 });
  assert.deepEqual(afterReserve, { stock: 4, reserved: 2 });
  assert.equal(cancelled.ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.deepEqual(afterCancel, { stock: 5, reserved: 2 });
});

test('CORRECT BEHAVIOUR: sell the final sellable unit and restore it once on cancellation', function () {
  var product = {
    id: 9,
    sku: 'SKU-009',
    name: 'Final sellable unit',
    hsn: '1006',
    price: 25,
    stock: 4,
    reserved: 3
  };
  var orderItem = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 1
  };
  var db = {
    products: [product],
    orders: [{
      id: 202,
      paymentMode: 'cash',
      status: 'pending',
      items: [orderItem],
      total: 25
    }],
    customers: []
  };

  assert.deepEqual(inventory.check(db.products, [orderItem]), { ok: true });
  inventory.reserve(db.products, [orderItem]);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 3, reserved: 3 });

  assert.equal(orders.cancel(db, 202, 'Correct behavior test').ok, true);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });

  assert.deepEqual(orders.cancel(db, 202, 'Second cancellation').ok, false);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });
});
