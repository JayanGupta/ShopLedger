const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('checkout accepts the last sellable unit with and without reservations', () => {
  for (const product of [
    { id: 1, stock: 1, reserved: 0 },
    { id: 1, stock: 4, reserved: 3 }
  ]) {
    assert.equal(inventory.check([product], [{ id: 1, qty: 1 }]).ok, true);
  }
});

test('a request exceeding sellable stock is rejected', () => {
  assert.equal(inventory.check([{ id: 1, stock: 4, reserved: 3 }], [{ id: 1, qty: 2 }]).ok, false);
});

test('cancelling #1007 restores physical stock once and preserves holds', () => {
  const db = {
    products: [{ id: 1, stock: 1, reserved: 0 }, { id: 2, stock: 6, reserved: 2 }],
    orders: [{ id: 1007, status: 'pending', items: [{ id: 1, qty: 2 }, { id: 2, qty: 2 }] }]
  };
  assert.equal(orders.cancel(db, 1007).ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.deepEqual(db.products.map(({ stock, reserved }) => [stock, reserved]), [[3, 0], [8, 2]]);
  assert.equal(orders.cancel(db, 1007).ok, false);
  assert.deepEqual(db.products.map(({ stock, reserved }) => [stock, reserved]), [[3, 0], [8, 2]]);
});

test('checkout counts repeated SKU lines toward the same sellable stock', () => {
  const product = { id: 1, stock: 4, reserved: 2 };
  const lines = [{ id: 1, qty: 1 }, { id: '1', qty: 1 }];
  assert.equal(inventory.check([product], lines).ok, true);
  assert.equal(inventory.check([product], [...lines, { id: 1, qty: 1 }]).ok, false);
});
