const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const lastUnit = {
  id: 6,
  sku: 'DRY-001',
  name: 'Ghee',
  hsn: '0405',
  price: 450,
  stock: 1,
  reserved: 0
};

test('CURRENT BEHAVIOUR: stock check accepts quantity one with one sellable unit', () => {
  assert.equal(inventory.getSellableStock(lastUnit), 1);
  assert.deepEqual(inventory.check([lastUnit], [{ id: lastUnit.id, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: stock check rejects quantity two with one sellable unit', () => {
  assert.deepEqual(inventory.check([lastUnit], [{ id: lastUnit.id, qty: 2 }]), {
    ok: false,
    msg: 'Ghee is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: stock check accepts quantity zero with one sellable unit', () => {
  assert.deepEqual(inventory.check([lastUnit], [{ id: lastUnit.id, qty: 0 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: four in stock with three reserved allows buying the one sellable unit', () => {
  const product = { ...lastUnit, stock: 4, reserved: 3 };

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: reserving deducts stock and cancelling a pending order restores it', () => {
  const product = { ...lastUnit, stock: 4, reserved: 1 };
  const db = { products: [product], orders: [] };
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 2
  }];
  const beforeOrder = { stock: product.stock, reserved: product.reserved };
  assert.deepEqual(inventory.check(db.products, items), { ok: true });

  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);

  const result = orders.cancel(db, order.id, 'Characterization test');
  const afterCancel = { stock: product.stock, reserved: product.reserved };

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 1 },
    afterReserve: { stock: 2, reserved: 1 },
    afterCancel: { stock: 4, reserved: 1 }
  });
});

test('checkout can sell exact stock and cancellation returns the items only once', () => {
  const product = { ...lastUnit, stock: 4, reserved: 1 };
  const products = [product];
  const line = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price
  };
  const exactSingle = inventory.check(products, [{ ...line, qty: 3 }]);
  const oversell = inventory.check(products, [{ ...line, qty: 2 }, { ...line, qty: 2 }]);
  const items = [{ ...line, qty: 1 }, { ...line, qty: 2 }];
  const exactSplit = inventory.check(products, items);

  inventory.reserve(products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };
  const db = { products, orders: [{ id: 1002, status: 'pending', paymentMode: 'cash', items }] };
  const cancelled = orders.cancel(db, 1002);
  const afterCancel = { stock: product.stock, reserved: product.reserved };
  const repeated = orders.cancel(db, 1002);

  assert.deepEqual({
    exactSingle: exactSingle.ok,
    oversell: oversell.ok,
    exactSplit: exactSplit.ok,
    afterReserve,
    cancelled: cancelled.ok,
    afterCancel,
    repeated: repeated.ok,
    afterRetry: { stock: product.stock, reserved: product.reserved }
  }, {
    exactSingle: true,
    oversell: false,
    exactSplit: true,
    afterReserve: { stock: 1, reserved: 1 },
    cancelled: true,
    afterCancel: { stock: 4, reserved: 1 },
    repeated: false,
    afterRetry: { stock: 4, reserved: 1 }
  });
});
