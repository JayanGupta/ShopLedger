const assert = require('node:assert').strict;
const { test } = require('node:test');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const product = {
  id: 1,
  sku: 'RICE-1',
  name: 'Rice',
  hsn: '1006',
  price: 100,
  stock: 1,
  reserved: 0,
};

function orderLine(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty,
  };
}

test('accepts qty 1 when sellable stock is 1', () => {
  assert.deepEqual(inventory.check([product], [orderLine(product, 1)]), {
    ok: true,
  });
});

test('rejects qty 2 when sellable stock is 1', () => {
  assert.deepEqual(inventory.check([product], [orderLine(product, 2)]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)',
  });
});

test('CURRENT BEHAVIOUR: accepts qty 0 when sellable stock is 1', () => {
  assert.deepEqual(inventory.check([product], [orderLine(product, 0)]), {
    ok: true,
  });
});

test('accepts qty 1 with stock 4 and reserved 3', () => {
  const partlyReserved = { ...product, stock: 4, reserved: 3 };

  assert.equal(inventory.getSellableStock(partlyReserved), 1);
  assert.deepEqual(inventory.check([partlyReserved], [orderLine(partlyReserved, 1)]), {
    ok: true,
  });
});

test('cancelling a pending order restores stock and preserves reservations', () => {
  const stockedProduct = { ...product, stock: 4, reserved: 1 };
  const db = { products: [stockedProduct], orders: [] };
  const items = [orderLine(stockedProduct, 2)];
  const beforeOrder = { stock: stockedProduct.stock, reserved: stockedProduct.reserved };

  inventory.reserve(db.products, items);
  const afterReserve = { stock: stockedProduct.stock, reserved: stockedProduct.reserved };

  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);
  const result = orders.cancel(db, order.id, 'Cancelled at checkout');
  const afterCancel = { stock: stockedProduct.stock, reserved: stockedProduct.reserved };

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 1 },
    afterReserve: { stock: 2, reserved: 1 },
    afterCancel: { stock: 4, reserved: 1 },
  });
});

test('sells the last sellable unit and restores it exactly once on cancellation', () => {
  const stockedProduct = { ...product, stock: 4, reserved: 3 };
  const items = [orderLine(stockedProduct, 1)];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [stockedProduct], orders: [order] };

  assert.equal(inventory.check(db.products, items).ok, true);
  assert.equal(inventory.check(db.products, [...items, ...items]).ok, false);

  inventory.reserve(db.products, items);
  assert.equal(stockedProduct.stock, 3);
  assert.equal(inventory.getSellableStock(stockedProduct), 0);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(stockedProduct.stock, 4);
  assert.equal(stockedProduct.reserved, 3);

  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(stockedProduct.stock, 4);
  assert.equal(stockedProduct.reserved, 3);
});
