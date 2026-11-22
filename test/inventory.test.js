'use strict';

const test = require('node:test');
const assert = require('node:assert');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(stock, reserved) {
  return {
    id: 7,
    sku: 'TEST-007',
    name: 'Test product',
    hsn: '1006',
    price: 25,
    stock,
    reserved
  };
}

function lineItem(qty) {
  // Same fields and shape assembled by routes/orders.js.
  return {
    id: 7,
    sku: 'TEST-007',
    name: 'Test product',
    hsn: '1006',
    price: 25,
    qty
  };
}

test('check accepts qty 1 when sellable stock is 1', function () {
  const p = product(1, 0);
  assert.deepStrictEqual(inventory.check([p], [lineItem(1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable stock is 1', function () {
  const p = product(1, 0);
  assert.deepStrictEqual(inventory.check([p], [lineItem(2)]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable stock is 1', function () {
  const p = product(1, 0);
  assert.deepStrictEqual(inventory.check([p], [lineItem(0)]), { ok: true });
});

test('check accepts qty 1 with stock 4 and reserved 3', function () {
  const p = product(4, 3);
  assert.deepStrictEqual(inventory.check([p], [lineItem(1)]), { ok: true });
});

test('reserve then cancel a pending order restores stock and leaves reserved unchanged', function () {
  const p = product(10, 2);
  const item = lineItem(3);
  const db = {
    products: [p],
    orders: [{
      id: 41,
      status: 'pending',
      paymentMode: 'cash',
      customerId: null,
      total: 75,
      items: [item]
    }]
  };
  const stockReserved = function () {
    return { stock: p.stock, reserved: p.reserved };
  };

  const before = stockReserved();
  inventory.reserve(db.products, db.orders[0].items);
  const afterReserve = stockReserved();
  const result = orders.cancel(db, 41, 'test cancellation');
  const afterCancel = stockReserved();

  assert.deepStrictEqual(before, { stock: 10, reserved: 2 });
  assert.deepStrictEqual(afterReserve, { stock: 7, reserved: 2 });
  assert.deepStrictEqual(afterCancel, before);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.order.status, 'cancelled');
});

test('Correct behaviour: sell exactly remaining stock and cancellation restores it once', function () {
  const p = product(4, 3);
  const item = lineItem(1);
  const db = {
    products: [p],
    orders: [{
      id: 42,
      status: 'pending',
      paymentMode: 'cash',
      customerId: null,
      total: 25,
      items: [item]
    }]
  };

  assert.deepStrictEqual(inventory.check(db.products, [item]), { ok: true });
  inventory.reserve(db.products, db.orders[0].items);
  assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, { stock: 3, reserved: 3 });

  const firstCancel = orders.cancel(db, 42, 'test cancellation');
  assert.strictEqual(firstCancel.ok, true);
  assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, { stock: 4, reserved: 3 });

  const secondCancel = orders.cancel(db, 42, 'duplicate cancellation');
  assert.strictEqual(secondCancel.ok, false);
  assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, { stock: 4, reserved: 3 });
});
