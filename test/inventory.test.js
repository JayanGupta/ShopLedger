const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(overrides) {
  return Object.assign({
    id: 1,
    sku: 'TEST-001',
    name: 'Test Product',
    hsn: '1006',
    price: 100,
    stock: 1,
    reserved: 0
  }, overrides);
}

test('inventory.check accepts qty 1 when sellable stock is 1', function () {
  const products = [product()];

  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: inventory.check rejects qty 2 when sellable stock is 1', function () {
  const products = [product()];

  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Test Product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: inventory.check accepts qty 0 when sellable stock is 1', function () {
  const products = [product()];

  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 0 }]), { ok: true });
});

test('stock 4 with reserved 3 has sellable 1 and accepts qty 1', function () {
  const products = [product({ stock: 4, reserved: 3 })];

  assert.equal(inventory.getSellableStock(products[0]), 1);
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
});

test('cancelling a reserved pending order restores deducted stock', function () {
  const item = {
    id: 1,
    sku: 'TEST-001',
    name: 'Test Product',
    hsn: '1006',
    price: 100,
    qty: 1
  };
  const db = {
    products: [product({ stock: 4, reserved: 3 })],
    orders: [{
      id: 1001,
      date: '01/01/2022',
      customer: 'Walk-in',
      customerId: null,
      paymentMode: 'cash',
      status: 'pending',
      items: [item],
      coupon: '',
      subtotal: 100,
      discount: 0,
      tax: 5,
      total: 105
    }],
    customers: []
  };

  const beforeOrder = { stock: db.products[0].stock, reserved: db.products[0].reserved };
  inventory.reserve(db.products, [item]);
  const afterReserve = { stock: db.products[0].stock, reserved: db.products[0].reserved };
  const result = orders.cancel(db, 1001, 'Characterization test');
  const afterCancel = { stock: db.products[0].stock, reserved: db.products[0].reserved };

  assert.deepEqual(beforeOrder, { stock: 4, reserved: 3 });
  assert.deepEqual(afterReserve, { stock: 3, reserved: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(afterCancel, { stock: 4, reserved: 3 });
});

test('allows the exact sellable quantity and restores its stock exactly once on cancellation', function () {
  const item = {
    id: 1,
    sku: 'TEST-001',
    name: 'Test Product',
    hsn: '1006',
    price: 100,
    qty: 1
  };
  const db = {
    products: [product({ stock: 4, reserved: 3 })],
    orders: [{
      id: 1001,
      date: '01/01/2022',
      customer: 'Walk-in',
      customerId: null,
      paymentMode: 'cash',
      status: 'pending',
      items: [item],
      coupon: '',
      subtotal: 100,
      discount: 0,
      tax: 5,
      total: 105
    }],
    customers: []
  };

  assert.deepEqual(inventory.check(db.products, [item]), { ok: true });
  inventory.reserve(db.products, [item]);
  assert.deepEqual(
    { stock: db.products[0].stock, reserved: db.products[0].reserved },
    { stock: 3, reserved: 3 }
  );

  const firstCancel = orders.cancel(db, 1001, 'Customer request');
  assert.equal(firstCancel.ok, true);
  assert.deepEqual(
    { stock: db.products[0].stock, reserved: db.products[0].reserved },
    { stock: 4, reserved: 3 }
  );

  const secondCancel = orders.cancel(db, 1001, 'Duplicate request');
  assert.equal(secondCancel.ok, false);
  assert.deepEqual(
    { stock: db.products[0].stock, reserved: db.products[0].reserved },
    { stock: 4, reserved: 3 }
  );
});
