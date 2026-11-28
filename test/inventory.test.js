const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function makeProduct(id, stock, reserved = 0) {
  return { id, name: 'Test product', stock, reserved, price: 10 };
}

test('FIXED BEHAVIOUR: inventory.check accepts a quantity equal to sellable stock', () => {
  const products = [makeProduct('P1', 1, 0)];
  assert.deepEqual(inventory.check(products, [{ id: 'P1', qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: inventory.check rejects a quantity above sellable stock', () => {
  const products = [makeProduct('P1', 1, 0)];
  assert.equal(inventory.check(products, [{ id: 'P1', qty: 2 }]).ok, false);
});

test('CURRENT BEHAVIOUR: inventory.check allows a zero quantity', () => {
  const products = [makeProduct('P1', 1, 0)];
  assert.deepEqual(inventory.check(products, [{ id: 'P1', qty: 0 }]), { ok: true });
});

test('FIXED BEHAVIOUR: reserved units are excluded and the exact remaining quantity is allowed', () => {
  const products = [makeProduct('P1', 4, 3)];
  assert.deepEqual(inventory.check(products, [{ id: 'P1', qty: 1 }]), { ok: true });
  assert.equal(inventory.check(products, [{ id: 'P1', qty: 2 }]).ok, false);
});

test('FIXED BEHAVIOUR: cancelling a pending order restores stock exactly once', () => {
  const product = makeProduct('P1', 8, 0);
  const order = {
    id: 1007,
    status: 'pending',
    paymentMode: 'cash',
    items: [{ id: 'P1', sku: 'SKU-P1', name: 'Test product', hsn: '1006', price: 10, qty: 2 }]
  };
  const db = { products: [product], orders: [order], customers: [], settlements: [], auditLog: [] };

  inventory.reserve(db.products, order.items);
  assert.equal(product.stock, 6);

  const first = orders.cancel(db, 1007, 'test cancellation');
  assert.equal(first.ok, true);
  assert.equal(product.stock, 8);

  const second = orders.cancel(db, 1007, 'repeat cancellation');
  assert.equal(second.ok, false);
  assert.equal(product.stock, 8);
  assert.equal(product.reserved, 0);
});
