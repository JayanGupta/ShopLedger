const assert = require('node:assert/strict');
const test = require('node:test');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('stock check allows exactly the sellable quantity', () => {
  const products = [
    { id: 1, name: 'Ghee', stock: 1, reserved: 0 },
    { id: 2, name: 'Chilli powder', stock: 4, reserved: 3 }
  ];
  assert.deepEqual(products.map(({ id }) => inventory.check(products, [{ id, qty: 1 }]).ok), [true, true]);
  assert.equal(inventory.check(products, [{ id: 2, qty: 2 }]).ok, false);
  assert.equal(inventory.check(products, [{ id: 2, qty: 1 }, { id: 2, qty: 1 }]).ok, false);
});

test('cancelling restores physical and sellable stock without touching reservations', () => {
  const product = { id: 1, stock: 4, reserved: 1 };
  const order = { id: 1007, status: 'pending', items: [{ id: 1, qty: 2 }] };
  const db = { products: [product], orders: [order] };
  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual([product.stock, product.reserved, inventory.getSellableStock(product)], [6, 1, 5]);
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(product.stock, 6);
});
