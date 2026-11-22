const { test } = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const product = {
  id: 1,
  sku: 'TEST-001',
  name: 'Test product',
  hsn: '0904',
  price: 100,
  stock: 1,
  reserved: 0
};

function orderLine({ id, sku, name, hsn, price }, qty) {
  return { id, sku, name, hsn, price, qty };
}

test('CURRENT BEHAVIOUR: check accepts qty 1 with 1 sellable', () => {
  assert.deepEqual(inventory.check([product], [orderLine(product, 1)]), { ok: true });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 with 1 sellable', () => {
  assert.deepEqual(inventory.check([product], [orderLine(product, 2)]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 with 1 sellable', () => {
  assert.deepEqual(inventory.check([product], [orderLine(product, 0)]), { ok: true });
});

test('CURRENT BEHAVIOUR: stock 4 and reserved 3 leave 1 sellable', () => {
  const reservedProduct = { ...product, stock: 4, reserved: 3 };
  assert.equal(inventory.getSellableStock(reservedProduct), 1);
  assert.deepEqual(inventory.check([reservedProduct], [orderLine(reservedProduct, 1)]), { ok: true });
  assert.deepEqual(inventory.check([reservedProduct], [orderLine(reservedProduct, 2)]), {
    ok: false,
    msg: 'Test product is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores physical stock', () => {
  const reservedProduct = { ...product, stock: 4, reserved: 3 };
  const order = {
    id: 42,
    status: 'pending',
    paymentMode: 'cash',
    items: [orderLine(reservedProduct, 1)]
  };
  const db = { products: [reservedProduct], orders: [order] };

  const beforeOrder = { stock: reservedProduct.stock, reserved: reservedProduct.reserved };
  inventory.reserve(db.products, order.items);
  const afterReserve = { stock: reservedProduct.stock, reserved: reservedProduct.reserved };
  const result = orders.cancel(db, order.id);
  const afterCancel = { stock: reservedProduct.stock, reserved: reservedProduct.reserved };

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 3 },
    afterReserve: { stock: 3, reserved: 3 },
    afterCancel: { stock: 4, reserved: 3 }
  });
});

test('the last sellable unit can be bought and cancellation restores it exactly once', () => {
  const reservedProduct = { ...product, stock: 4, reserved: 3 };
  const line = orderLine(reservedProduct, 1);
  const order = { id: 42, status: 'pending', paymentMode: 'cash', items: [line] };
  const db = { products: [reservedProduct], orders: [order] };

  const exactQtyAccepted = inventory.check(db.products, [line]).ok;
  const excessQtyAccepted = inventory.check(db.products, [orderLine(reservedProduct, 2)]).ok;
  const splitExcessQtyAccepted = inventory.check(db.products, [line, line]).ok;
  inventory.reserve(db.products, order.items);
  const sellableAfterSale = inventory.getSellableStock(reservedProduct);
  const firstCancel = orders.cancel(db, order.id).ok;
  const stockAfterCancel = reservedProduct.stock;
  const secondCancel = orders.cancel(db, order.id).ok;

  assert.deepEqual({
    exactQtyAccepted,
    excessQtyAccepted,
    splitExcessQtyAccepted,
    sellableAfterSale,
    firstCancel,
    stockAfterCancel,
    secondCancel,
    finalStock: reservedProduct.stock,
    finalReserved: reservedProduct.reserved
  }, {
    exactQtyAccepted: true,
    excessQtyAccepted: false,
    splitExcessQtyAccepted: false,
    sellableAfterSale: 0,
    firstCancel: true,
    stockAfterCancel: 4,
    secondCancel: false,
    finalStock: 4,
    finalReserved: 3
  });
});
