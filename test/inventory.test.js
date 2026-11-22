const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const { cancel } = require('../lib/orders');

test('CURRENT BEHAVIOUR: qty 1 passes with 1 sellable unit', () => {
  const product = { id: 1, name: 'Rice', stock: 1, reserved: 0 };

  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: qty 2 is rejected with 1 sellable unit', () => {
  const product = { id: 1, name: 'Rice', stock: 1, reserved: 0 };

  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: qty 0 passes the stock check with 1 sellable unit', () => {
  const product = { id: 1, name: 'Rice', stock: 1, reserved: 0 };

  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 0 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: stock 4 with 3 reserved leaves 1 sellable unit and qty 1 passes', () => {
  const product = { id: 1, name: 'Rice', stock: 4, reserved: 3 };

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores physical stock', () => {
  const product = {
    id: 1,
    sku: 'RICE-01',
    name: 'Rice',
    hsn: '1006',
    price: 50,
    stock: 4,
    reserved: 1
  };
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 2
  }];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  const beforeOrder = { stock: product.stock, reserved: product.reserved };
  assert.deepEqual(inventory.check(db.products, items), { ok: true });

  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };

  const result = cancel(db, order.id, 'Cancelled in test');
  const afterCancel = { stock: product.stock, reserved: product.reserved };

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 1 },
    afterReserve: { stock: 2, reserved: 1 },
    afterCancel: { stock: 4, reserved: 1 }
  });
});

test('buys exactly the sellable stock and restores it only once on cancellation', () => {
  const product = {
    id: 1, sku: 'RICE-01', name: 'Rice', hsn: '1006', price: 50,
    stock: 5, reserved: 3
  };
  const line = {
    id: product.id, sku: product.sku, name: product.name,
    hsn: product.hsn, price: product.price, qty: 1
  };
  const items = [line, { ...line }];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  assert.equal(inventory.check(db.products, [...items, line]).ok, false);

  inventory.reserve(db.products, items);
  assert.equal(product.stock, 3);
  assert.equal(inventory.getSellableStock(product), 0);

  assert.equal(cancel(db, order.id).ok, true);
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 3);

  assert.equal(cancel(db, order.id).ok, false);
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 3);
});
