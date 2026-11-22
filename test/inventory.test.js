'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('allows qty 1 when sellable stock is 1', function () {
  const product = { id: 1, name: 'Test product', stock: 1, reserved: 0 };
  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: rejects qty 2 when sellable stock is 1', function () {
  const product = { id: 1, name: 'Test product', stock: 1, reserved: 0 };
  assert.equal(inventory.check([product], [{ id: 1, qty: 2 }]).ok, false);
});

test('CURRENT BEHAVIOUR: accepts qty 0 when sellable stock is 1', function () {
  const product = { id: 1, name: 'Test product', stock: 1, reserved: 0 };
  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 0 }]), { ok: true });
});

test('stock 4 with reserved 3 has sellable 1 and allows qty 1', function () {
  const product = { id: 1, name: 'Test product', stock: 4, reserved: 3 };
  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 1 }]), { ok: true });
});

test('cancelling a pending reserved order restores stock after reserve', function () {
  const product = { id: 1, sku: 'TEST-1', name: 'Test product', hsn: '1006', price: 10, stock: 4, reserved: 3 };
  const db = { nextOrderId: 1001, products: [product], orders: [] };
  // Match the line-item fields assembled by routes/orders.js exactly.
  const items = [{ id: product.id, sku: product.sku, name: product.name, hsn: product.hsn, price: product.price, qty: 1 }];

  const beforeOrder = { stock: product.stock, reserved: product.reserved };
  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };
  const order = orders.add(db, { status: 'pending', paymentMode: 'cash', items: items });
  const result = orders.cancel(db, order.id, 'test cancellation');
  const afterCancel = { stock: product.stock, reserved: product.reserved };

  assert.deepEqual(beforeOrder, { stock: 4, reserved: 3 });
  assert.deepEqual(afterReserve, { stock: 3, reserved: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(afterCancel, { stock: 4, reserved: 3 });
});

test('allows buying exactly the sellable stock and restores stock once when cancelling', function () {
  const product = { id: 1, sku: 'TEST-1', name: 'Test product', hsn: '1006', price: 10, stock: 4, reserved: 3 };
  const db = { nextOrderId: 1001, products: [product], orders: [] };
  // Match the line-item fields assembled by routes/orders.js exactly.
  const items = [{ id: product.id, sku: product.sku, name: product.name, hsn: product.hsn, price: product.price, qty: 1 }];

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  assert.equal(inventory.check(db.products, [items[0], items[0]]).ok, false);
  inventory.reserve(db.products, items);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 3, reserved: 3 });

  const order = orders.add(db, { status: 'pending', paymentMode: 'cash', items: items });
  assert.equal(orders.cancel(db, order.id, 'test cancellation').ok, true);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });
  assert.equal(orders.cancel(db, order.id, 'duplicate cancellation').ok, false);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });
});
