const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(stock, reserved) {
  return { id: 1, sku: 'DRY-001', name: 'Ghee', hsn: '0405', price: 300, stock, reserved };
}

function lineItem({ id, sku, name, hsn, price }, qty) {
  return { id, sku, name, hsn, price, qty };
}

function check(item, qty) {
  return inventory.check([item], [lineItem(item, qty)]);
}

test('Last sellable unit passes', () => {
  assert.deepEqual(check(product(1, 0), 1), { ok: true });
});

test('Two units exceed one available', () => {
  assert.equal(check(product(1, 0), 2).ok, false);
});

test('CURRENT BEHAVIOUR: Zero quantity passes the stock check', () => {
  assert.deepEqual(check(product(1, 0), 0), { ok: true });
});

test('Reserved units are excluded', () => {
  const item = product(4, 3);
  assert.equal(inventory.getSellableStock(item), 1);
  assert.equal(check(item, 1).ok, true);
  assert.equal(check(item, 2).ok, false);
});

test('A split-line order can exhaust sellable stock and be refunded only once', () => {
  const item = product(5, 3);
  const items = [lineItem(item, 1), lineItem(item, 1)];
  const db = { products: [item], orders: [] };
  assert.equal(inventory.check(db.products, items).ok, true);
  assert.equal(inventory.check(db.products, items.concat(lineItem(item, 1))).ok, false,
    'three units across cart lines exceed the two sellable units');

  inventory.reserve(db.products, items);
  assert.equal(inventory.getSellableStock(item), 0);
  db.orders.push({ id: 1007, status: 'pending', paymentMode: 'cash', items });
  assert.equal(orders.cancel(db, 1007).ok, true);
  assert.equal(item.stock, 5);
  assert.equal(orders.cancel(db, 1007).ok, false);
  assert.equal(item.stock, 5);
  assert.equal(item.reserved, 3);
});

test('Cancelling a pending order restores physical stock', () => {
  const item = product(4, 3);
  const items = [lineItem(item, 1)];
  const db = { products: [item], orders: [] };
  const snapshot = () => ({ stock: item.stock, reserved: item.reserved });
  assert.deepEqual(snapshot(), { stock: 4, reserved: 3 });

  inventory.reserve(db.products, items);
  assert.deepEqual(snapshot(), { stock: 3, reserved: 3 });

  db.orders.push({ id: 1007, status: 'pending', paymentMode: 'cash', items });
  const result = orders.cancel(db, 1007, 'Cancelled by operator');
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(snapshot(), { stock: 4, reserved: 3 });
});
