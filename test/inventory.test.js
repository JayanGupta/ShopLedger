const test = require('node:test');
const assert = require('node:assert');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('qty 1 is allowed when sellable stock is 1', function () {
  const products = [{ id: 1, name: 'Rice', stock: 1, reserved: 0 }];

  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: qty 2 is rejected when sellable stock is 1', function () {
  const products = [{ id: 1, name: 'Rice', stock: 1, reserved: 0 }];

  assert.deepStrictEqual(
    inventory.check(products, [{ id: 1, qty: 2 }]),
    { ok: false, msg: 'Rice is out of stock (1 sellable available)' }
  );
});

test('CURRENT BEHAVIOUR: qty 0 is accepted when sellable stock is 1', function () {
  const products = [{ id: 1, name: 'Rice', stock: 1, reserved: 0 }];

  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 0 }]), { ok: true });
});

test('stock 4 with reserved 3 allows selling its 1 sellable unit', function () {
  const products = [{ id: 1, name: 'Rice', stock: 4, reserved: 3 }];

  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
});

test('cancelling a pending order restores its stock', function () {
  const product = {
    id: 1,
    sku: 'RICE-001',
    name: 'Rice',
    hsn: '1006',
    price: 10,
    stock: 4,
    reserved: 3
  };
  // Match the line-item shape constructed in routes/orders.js.
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 1
  }];
  const db = {
    products: [product],
    orders: [{ id: 42, status: 'pending', items: items, paymentMode: 'cash', total: 10 }]
  };

  const beforeOrder = { stock: product.stock, reserved: product.reserved };
  assert.deepStrictEqual(beforeOrder, { stock: 4, reserved: 3 });

  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };
  assert.deepStrictEqual(afterReserve, { stock: 3, reserved: 3 });

  const result = orders.cancel(db, 42, 'test cancellation');
  const afterCancel = { stock: product.stock, reserved: product.reserved };
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.order.status, 'cancelled');
  assert.deepStrictEqual(afterCancel, { stock: 4, reserved: 3 });
});

test('buying exactly sellable stock succeeds and cancellation restores stock once', function () {
  const product = {
    id: 1,
    sku: 'RICE-001',
    name: 'Rice',
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
  const db = {
    products: [product],
    orders: [{ id: 43, status: 'pending', items: items, paymentMode: 'cash', total: 10 }]
  };

  const exactQuantityCheck = inventory.check(db.products, items);
  const excessQuantityCheck = inventory.check(db.products, [{ id: product.id, qty: 2 }]);
  const duplicateLinesCheck = inventory.check(db.products, [
    { id: product.id, qty: 1 },
    { id: product.id, qty: 1 }
  ]);
  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };
  const firstCancel = orders.cancel(db, 43, 'test cancellation');
  const afterFirstCancel = { stock: product.stock, reserved: product.reserved };
  const secondCancel = orders.cancel(db, 43, 'duplicate cancellation');
  const afterSecondCancel = { stock: product.stock, reserved: product.reserved };

  assert.deepStrictEqual(exactQuantityCheck, { ok: true });
  assert.strictEqual(excessQuantityCheck.ok, false);
  assert.strictEqual(duplicateLinesCheck.ok, false);
  assert.deepStrictEqual(afterReserve, { stock: 3, reserved: 3 });
  assert.strictEqual(firstCancel.ok, true);
  assert.deepStrictEqual(afterFirstCancel, { stock: 4, reserved: 3 });
  assert.strictEqual(secondCancel.ok, false);
  assert.deepStrictEqual(afterSecondCancel, { stock: 4, reserved: 3 });
});
