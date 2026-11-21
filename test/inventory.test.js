const assert = require('node:assert/strict');
const { test } = require('node:test');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const ghee = { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', hsn: '0405', price: 450 };
const chilli = { id: 11, name: 'Byadgi Kashmiri Chilli Powder 500g' };

test('accepts a quantity equal to sellable stock, including with reservations', () => {
  for (const product of [{ ...ghee, stock: 1, reserved: 0 }, { ...chilli, stock: 4, reserved: 3 }]) {
    assert.equal(inventory.getSellableStock(product), 1);
    assert.equal(inventory.check([product], [{ id: product.id, qty: 1 }]).ok, true);
  }
});

test('rejects a quantity above sellable stock and accepts zero in the stock check', () => {
  const product = { ...ghee, stock: 4, reserved: 3 };
  assert.equal(inventory.check([product], [{ id: product.id, qty: 2 }]).ok, false);
  assert.equal(inventory.check([product], [{ id: product.id, qty: 0 }]).ok, true);
});

test('cancellation restores physical stock and preserves wholesale reservations', () => {
  const product = { ...ghee, stock: 4, reserved: 2 };
  const items = [{ ...ghee, qty: 2 }];
  const db = { products: [product], orders: [{ id: 1007, status: 'pending', items }] };

  assert.deepEqual([product.stock, product.reserved], [4, 2]);
  inventory.reserve(db.products, items);
  assert.deepEqual([product.stock, product.reserved], [2, 2]);
  assert.equal(orders.cancel(db, 1007).ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.deepEqual([product.stock, product.reserved], [4, 2]);
});

test('rejects duplicate lines whose combined quantity exceeds sellable stock', () => {
  const product = { ...ghee, stock: 3, reserved: 1 };
  const items = [{ id: product.id, qty: 1 }, { id: String(product.id), qty: 1 }];
  assert.equal(inventory.check([product], items).ok, true);
  items[1].qty = 2;
  assert.equal(inventory.check([product], items).ok, false);
});

test('sells the last available unit and restores it exactly once on cancellation', () => {
  const product = { ...ghee, stock: 4, reserved: 3 };
  const items = [{ ...ghee, qty: 1 }];
  const db = { products: [product], orders: [{ id: 1007, status: 'pending', items }] };

  const lastUnit = inventory.check(db.products, items);
  inventory.reserve(db.products, items);
  const sellableAfterSale = inventory.getSellableStock(product);
  const cancelled = orders.cancel(db, 1007);
  const stockAfterCancellation = [product.stock, product.reserved];
  const retry = orders.cancel(db, 1007);

  assert.deepEqual({
    lastUnit: lastUnit.ok,
    sellableAfterSale,
    cancelled: cancelled.ok,
    stockAfterCancellation,
    retry: retry.ok,
    finalStock: [product.stock, product.reserved]
  }, {
    lastUnit: true,
    sellableAfterSale: 0,
    cancelled: true,
    stockAfterCancellation: [4, 3],
    retry: false,
    finalStock: [4, 3]
  });
});
