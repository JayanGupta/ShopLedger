const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const tea = { id: 1, sku: 'TEA-001', name: 'Tea', hsn: '0902', price: 100 };

function lineItem(product, qty) {
  const { id, sku, name, hsn, price } = product;
  return { id, sku, name, hsn, price, qty };
}

test('checkout can sell exactly what remains and cancellation restores it once', () => {
  const product = { ...tea, stock: 4, reserved: 3 };
  const items = [lineItem(product, 1)];
  const order = { id: 1007, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };
  const exact = inventory.check(db.products, items);
  const excess = inventory.check(db.products, [lineItem(product, 2)]);
  const repeatedLines = inventory.check(db.products, [...items, ...items]);

  inventory.reserve(db.products, items);
  const soldStock = product.stock;
  const firstCancel = orders.cancel(db, order.id);
  const restoredStock = product.stock;
  const secondCancel = orders.cancel(db, order.id);

  assert.deepEqual(
    [exact.ok, excess.ok, repeatedLines.ok, soldStock,
      firstCancel.ok, restoredStock, secondCancel.ok, product.stock, product.reserved],
    [true, false, false, 3, true, 4, false, 4, 3]
  );
});

test('CURRENT BEHAVIOUR: check accepts qty 1 when sellable stock is 1', () => {
  const product = { ...tea, stock: 1, reserved: 0 };
  assert.deepEqual(inventory.check([product], [lineItem(product, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable stock is 1', () => {
  const product = { ...tea, stock: 1, reserved: 0 };
  assert.deepEqual(inventory.check([product], [lineItem(product, 2)]), {
    ok: false,
    msg: 'Tea is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable stock is 1', () => {
  const product = { ...tea, stock: 1, reserved: 0 };
  assert.deepEqual(inventory.check([product], [lineItem(product, 0)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check excludes 3 reserved units from stock of 4', () => {
  const product = { ...tea, stock: 4, reserved: 3 };
  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [lineItem(product, 1)]), { ok: true });
  assert.deepEqual(inventory.check([product], [lineItem(product, 2)]), {
    ok: false,
    msg: 'Tea is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores physical stock', () => {
  const product = { ...tea, stock: 4, reserved: 3 };
  const items = [lineItem(product, 1)];
  const db = { products: [product], orders: [] };
  const snapshot = () => ({ stock: product.stock, reserved: product.reserved });

  const beforeOrder = snapshot();
  inventory.reserve(db.products, items);
  const afterReserve = snapshot();
  const order = { id: 1007, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);

  const result = orders.cancel(db, order.id);
  const afterCancel = snapshot();

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 3 },
    afterReserve: { stock: 3, reserved: 3 },
    afterCancel: { stock: 4, reserved: 3 }
  });
});
