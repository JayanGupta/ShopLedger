const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function makeProduct(stock, reserved) {
  return { id: 1, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 50, stock, reserved };
}

function makeLineItem(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty
  };
}

test('CURRENT BEHAVIOUR: check accepts qty 1 with 1 sellable', () => {
  const product = makeProduct(1, 0);

  assert.deepEqual(inventory.check([product], [makeLineItem(product, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 with 1 sellable', () => {
  const product = makeProduct(1, 0);

  assert.deepEqual(inventory.check([product], [makeLineItem(product, 2)]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 with 1 sellable', () => {
  const product = makeProduct(1, 0);

  assert.deepEqual(inventory.check([product], [makeLineItem(product, 0)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check accepts qty 1 with stock 4 and reserved 3', () => {
  const product = makeProduct(4, 3);

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [makeLineItem(product, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores stock', () => {
  const product = makeProduct(4, 1);
  const items = [makeLineItem(product, 2)];
  const db = { products: [product], orders: [] };

  const beforeOrder = { stock: product.stock, reserved: product.reserved };
  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };

  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);
  const result = orders.cancel(db, order.id, 'Cancelled at the counter');
  const afterCancel = { stock: product.stock, reserved: product.reserved };

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 1 },
    afterReserve: { stock: 2, reserved: 1 },
    afterCancel: { stock: 4, reserved: 1 }
  });
});

test('selling the remaining stock allows one restock on cancellation', () => {
  const product = makeProduct(4, 2);
  const items = [makeLineItem(product, 1), makeLineItem(product, 1)];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };
  const excessItems = [...items, makeLineItem(product, 1)];

  assert.equal(inventory.check(db.products, excessItems).ok, false, 'combined quantity exceeds sellable stock');
  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  assert.equal(product.stock, 2);
  assert.equal(product.reserved, 2);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(product.stock, 4);
  assert.equal(product.reserved, 2);

  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(product.stock, 4);
  assert.equal(product.reserved, 2);
});
