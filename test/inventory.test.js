'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('inventory.check allows exact sellable quantity and rejects larger requests', () => {
  const product = {
    id: 1,
    sku: 'SKU-1',
    name: 'Test Product',
    hsn: '1006',
    price: 10,
    stock: 1,
    reserved: 0
  };

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 1 }]), { ok: true });
  assert.equal(inventory.check([product], [{ id: 1, qty: 2 }]).ok, false);
  assert.deepEqual(inventory.check([product], [{ id: 1, qty: 0 }]), { ok: true });

  const reservedProduct = {
    id: 2,
    sku: 'SKU-2',
    name: 'Reserved Product',
    hsn: '1006',
    price: 10,
    stock: 4,
    reserved: 3
  };
  assert.equal(inventory.getSellableStock(reservedProduct), 1);
  assert.equal(inventory.check([reservedProduct], [{ id: 2, qty: 1 }]).ok, true);
});

test('cancelling a pending order restores stock from route-shaped line items exactly once', () => {
  const product = {
    id: 7,
    sku: 'SKU-7',
    name: 'Test Product',
    hsn: '1006',
    price: 10,
    stock: 4,
    reserved: 3
  };
  // Match the line item fields constructed in routes/orders.js.
  const order = {
    id: 9001,
    date: '01/02/2022',
    customer: 'Walk-in',
    customerId: null,
    paymentMode: 'cash',
    status: 'pending',
    items: [{
      id: product.id,
      sku: product.sku,
      name: product.name,
      hsn: product.hsn,
      price: product.price,
      qty: 1
    }],
    coupon: '',
    subtotal: 10,
    discount: 0,
    tax: 0.5,
    total: 10.5
  };
  const db = { products: [product], orders: [order] };

  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });

  inventory.reserve(db.products, order.items);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 3, reserved: 3 });

  const result = orders.cancel(db, order.id, 'Characterization test');
  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });

  const secondResult = orders.cancel(db, order.id, 'Duplicate cancellation');
  assert.equal(secondResult.ok, false);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });
});

test('an order may use all sellable stock and cancellation restores it exactly once', () => {
  const product = {
    id: 8,
    sku: 'SKU-8',
    name: 'Test Product',
    hsn: '1006',
    price: 10,
    stock: 4,
    reserved: 3
  };
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 1
  }];
  const order = {
    id: 9002,
    date: '01/02/2022',
    customer: 'Walk-in',
    customerId: null,
    paymentMode: 'cash',
    status: 'pending',
    items: items,
    coupon: '',
    subtotal: 10,
    discount: 0,
    tax: 0.5,
    total: 10.5
  };
  const db = { products: [product], orders: [order] };

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  assert.equal(inventory.check(db.products, [{ id: product.id, qty: 2 }]).ok, false);
  assert.equal(inventory.check(db.products, [
    { id: product.id, qty: 1 },
    { id: product.id, qty: 1 }
  ]).ok, false);

  inventory.reserve(db.products, items);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 3, reserved: 3 });

  const cancelled = orders.cancel(db, order.id, 'Return stock');
  assert.equal(cancelled.ok, true);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });

  const secondCancel = orders.cancel(db, order.id, 'Duplicate cancellation');
  assert.equal(secondCancel.ok, false);
  assert.deepEqual({ stock: product.stock, reserved: product.reserved }, { stock: 4, reserved: 3 });
});
