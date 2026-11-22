'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(stock, reserved) {
  return { id: 1, sku: 'TEST-1', name: 'Test product', hsn: '1006', price: 12, stock, reserved };
}

test('check accepts qty 1 when sellable stock is 1', function () {
  const result = inventory.check([product(1, 0)], [{ id: 1, qty: 1 }]);

  assert.deepEqual(result, { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable stock is 1', function () {
  const result = inventory.check([product(1, 0)], [{ id: 1, qty: 2 }]);

  assert.deepEqual(result, {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable stock is 1', function () {
  const result = inventory.check([product(1, 0)], [{ id: 1, qty: 0 }]);

  assert.deepEqual(result, { ok: true });
});

test('check allows the one sellable unit when stock is 4 and reserved is 3', function () {
  const result = inventory.check([product(4, 3)], [{ id: 1, qty: 1 }]);

  assert.deepEqual(result, { ok: true });
});

test('cancelling a pending order restores stock after reserve', function () {
  const item = {
    id: 1,
    sku: 'TEST-1',
    name: 'Test product',
    hsn: '1006',
    price: 12,
    qty: 1
  };
  const db = {
    products: [product(5, 3)],
    orders: [{ id: 1001, status: 'pending', paymentMode: 'cash', customerId: null, total: 12, items: [item] }]
  };
  const trackedProduct = db.products[0];
  const beforeOrder = { stock: trackedProduct.stock, reserved: trackedProduct.reserved };

  inventory.reserve(db.products, [item]);
  const afterReserve = { stock: trackedProduct.stock, reserved: trackedProduct.reserved };

  const result = orders.cancel(db, 1001, 'Characterization test');
  const afterCancel = { stock: trackedProduct.stock, reserved: trackedProduct.reserved };

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(beforeOrder, { stock: 5, reserved: 3 });
  assert.deepEqual(afterReserve, { stock: 4, reserved: 3 });
  assert.deepEqual(afterCancel, { stock: 5, reserved: 3 });
});

test('inventory allows exact sellable quantity and cancellation restores stock exactly once', function () {
  const productRecord = product(4, 3);
  const item = {
    id: 1,
    sku: 'TEST-1',
    name: 'Test product',
    hsn: '1006',
    price: 12,
    qty: 1
  };
  const db = {
    products: [productRecord],
    orders: [{ id: 1002, status: 'pending', paymentMode: 'cash', customerId: null, total: 12, items: [item] }]
  };

  assert.deepEqual(inventory.check(db.products, [item]), { ok: true });
  assert.deepEqual(inventory.check(db.products, [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });

  inventory.reserve(db.products, [item]);
  assert.deepEqual({ stock: productRecord.stock, reserved: productRecord.reserved }, { stock: 3, reserved: 3 });

  const cancelled = orders.cancel(db, 1002, 'Regression test');
  assert.equal(cancelled.ok, true);
  assert.deepEqual({ stock: productRecord.stock, reserved: productRecord.reserved }, { stock: 4, reserved: 3 });

  const repeatedCancel = orders.cancel(db, 1002, 'Repeated regression test');
  assert.equal(repeatedCancel.ok, false);
  assert.deepEqual({ stock: productRecord.stock, reserved: productRecord.reserved }, { stock: 4, reserved: 3 });
});
