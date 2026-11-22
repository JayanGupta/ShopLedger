const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(stock, reserved) {
  return { id: 1, sku: 'SKU-1', name: 'Test product', hsn: '1006', price: 10, stock, reserved };
}

function routeLineItem() {
  // Match routes/orders.js: item identity is `id`, with no `productId`.
  return { id: 1, sku: 'SKU-1', name: 'Test product', hsn: '1006', price: 10, qty: 1 };
}

test('CURRENT BEHAVIOUR: check rejects qty 1 when sellable stock is 1', function () {
  const products = [product(1, 0)];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable stock is 1', function () {
  const products = [product(1, 0)];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable stock is 1', function () {
  const products = [product(1, 0)];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 0 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 1 when stock 4 and reserved 3', function () {
  const products = [product(4, 3)];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: reserve then cancel pending order leaves stock deducted and reserved unchanged', function () {
  const p = product(5, 2);
  const item = routeLineItem();
  const db = {
    products: [p],
    orders: [{ id: 1001, status: 'pending', paymentMode: 'cash', items: [item], total: 10 }]
  };

  const before = { stock: p.stock, reserved: p.reserved };
  inventory.reserve(db.products, db.orders[0].items);
  const afterReserve = { stock: p.stock, reserved: p.reserved };
  const result = orders.cancel(db, 1001, 'test cancellation');
  const afterCancel = { stock: p.stock, reserved: p.reserved };

  assert.equal(result.ok, true);
  assert.deepEqual(before, { stock: 5, reserved: 2 });
  assert.deepEqual(afterReserve, { stock: 4, reserved: 2 });
  assert.deepEqual(afterCancel, { stock: 4, reserved: 2 });
  assert.equal(result.order.status, 'cancelled');
});
