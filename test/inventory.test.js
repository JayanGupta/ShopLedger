const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const catalogFields = { id: 7, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 50 };

function check(stock, reserved, qty) {
  const product = { ...catalogFields, stock, reserved };
  const item = { ...catalogFields, qty };
  return inventory.check([product], [item]);
}

const oneSellableError = { ok: false, msg: 'Rice is out of stock (1 sellable available)' };

test('accepts the last sellable unit', () => {
  assert.deepEqual(check(1, 0, 1), { ok: true });
});

test('rejects two units when only one is sellable', () => {
  assert.deepEqual(check(1, 0, 2), oneSellableError);
});

test('CURRENT BEHAVIOUR: accepts zero units when one is sellable', () => {
  assert.deepEqual(check(1, 0, 0), { ok: true });
});

test('accepts one unit with four in stock and three reserved', () => {
  assert.deepEqual(check(4, 3, 1), { ok: true });
});

test('cancelling a pending order restores physical stock and preserves reservations', () => {
  const product = { ...catalogFields, stock: 8, reserved: 3 };
  const db = { products: [product], orders: [] };
  const items = [{ ...catalogFields, qty: 2 }];
  const counts = () => ({ stock: db.products[0].stock, reserved: db.products[0].reserved });

  const beforeOrder = counts();
  inventory.reserve(db.products, items);
  const afterReserve = counts();

  db.orders.push({ id: 101, status: 'pending', paymentMode: 'cash', items });
  const result = orders.cancel(db, 101, 'Customer cancelled');
  const afterCancel = counts();

  assert.equal(result.ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 8, reserved: 3 },
    afterReserve: { stock: 6, reserved: 3 },
    afterCancel: { stock: 8, reserved: 3 }
  });
});

test('repeated lines can buy the remaining stock and cancellation restores it once', () => {
  const product = { ...catalogFields, stock: 5, reserved: 2 };
  const items = [{ ...catalogFields, qty: 2 }, { ...catalogFields, qty: 1 }];
  const order = { id: 102, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  const tooMany = [...items, { ...catalogFields, qty: 1 }];
  assert.equal(inventory.check(db.products, tooMany).ok, false, 'four units exceed three sellable');
  assert.equal(inventory.check(db.products, items).ok, true);
  inventory.reserve(db.products, items);
  assert.equal(product.stock, 2);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(product.stock, 5);
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 2);
});
