const test = require('node:test');
const assert = require('node:assert').strict;
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function makeProduct(stock, reserved) {
  return { id: 7, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 50, stock, reserved };
}

function lineItem(product, qty) {
  const { id, sku, name, hsn, price } = product;
  return { id, sku, name, hsn, price, qty };
}

const oneSellableUnit = [
  { name: 'qty 1 passes', stock: 1, reserved: 0, qty: 1, ok: true },
  { name: 'qty 2 is rejected', stock: 1, reserved: 0, qty: 2, ok: false },
  { name: 'qty 0 passes', stock: 1, reserved: 0, qty: 0, ok: true },
  { name: 'qty 1 passes with 4 in stock and 3 reserved', stock: 4, reserved: 3, qty: 1, ok: true },
];

for (const { name, stock, reserved, qty, ok } of oneSellableUnit) {
  test('CURRENT BEHAVIOUR: ' + name + ' (1 sellable)', () => {
    const product = makeProduct(stock, reserved);
    assert.equal(inventory.getSellableStock(product), 1);
    const result = inventory.check([product], [lineItem(product, qty)]);
    assert.equal(result.ok, ok);
    if (!ok) assert.equal(result.msg, 'Rice is out of stock (1 sellable available)');
  });
}

test('pending cancellation restores deducted stock', () => {
  const product = makeProduct(7, 2);
  const db = { products: [product], orders: [] };
  const items = [lineItem(product, 3)];
  function counts() {
    const { stock, reserved } = db.products[0];
    return { stock, reserved };
  }

  assert.deepEqual(counts(), { stock: 7, reserved: 2 });
  inventory.reserve(db.products, items);
  assert.deepEqual(counts(), { stock: 4, reserved: 2 });

  const order = { id: 101, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);
  const result = orders.cancel(db, order.id, 'Customer cancelled');
  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual(counts(), { stock: 7, reserved: 2 });
});

test('split lines can buy exactly the sellable stock and cancellation restores it once', () => {
  const product = makeProduct(5, 2);
  const items = [lineItem(product, 1), lineItem(product, 2)];
  const order = { id: 101, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  assert.equal(inventory.check(db.products, [...items, lineItem(product, 1)]).ok, false,
    'combined quantity must not exceed three sellable units');
  assert.equal(inventory.check(db.products, items).ok, true);
  inventory.reserve(db.products, items);
  assert.equal(product.stock, 2);
  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(product.stock, 5);
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 2);
});
