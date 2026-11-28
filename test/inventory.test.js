var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

function makeProduct(stock, reserved) {
  return {
    id: 1,
    sku: 'RICE-1',
    name: 'Rice',
    hsn: '1006',
    price: 100,
    stock: stock,
    reserved: reserved
  };
}

function orderLine(product, qty) {
  // Match the fields stored by POST /api/orders.
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: qty
  };
}

test('CURRENT BEHAVIOUR: qty 1 is accepted with 1 sellable', function () {
  var product = makeProduct(1, 0);

  assert.deepEqual(inventory.check([product], [orderLine(product, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: qty 2 is rejected with 1 sellable', function () {
  var product = makeProduct(1, 0);

  assert.deepEqual(inventory.check([product], [orderLine(product, 2)]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: qty 0 passes the stock check with 1 sellable', function () {
  var product = makeProduct(1, 0);

  assert.deepEqual(inventory.check([product], [orderLine(product, 0)]), { ok: true });
});

test('CURRENT BEHAVIOUR: stock 4 reserved 3 leaves 1 sellable and qty 1 is accepted', function () {
  var product = makeProduct(4, 3);

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [orderLine(product, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores stock and keeps reserved units', function () {
  var product = makeProduct(4, 1);
  var items = [orderLine(product, 2)];
  var db = { products: [product], orders: [] };

  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 1 }, 'before the order');

  inventory.reserve(db.products, items);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 2, reserved: 1 }, 'after reserve');

  var order = { id: 1001, status: 'pending', paymentMode: 'cash', items: items };
  db.orders.push(order);
  var result = orders.cancel(db, order.id, 'Cancelled from order desk');

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 1 }, 'after cancel');
});

test('selling the remaining stock across repeated lines restores it exactly once on cancellation', function () {
  var product = makeProduct(6, 2);
  var items = [orderLine(product, 2), orderLine(product, 2)];
  var order = { id: 1001, status: 'pending', paymentMode: 'cash', items: items };
  var db = { products: [product], orders: [order] };

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  assert.equal(product.stock, 2);
  assert.equal(inventory.getSellableStock(product), 0);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(product.stock, 6, 'the first cancellation restores all four units');
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(product.stock, 6, 'retrying cancellation leaves stock unchanged');
  assert.equal(product.reserved, 2);

  var tooMany = [orderLine(product, 2), orderLine(product, 3)];
  assert.equal(inventory.check(db.products, tooMany).ok, false, 'line quantities must be checked together');
});
