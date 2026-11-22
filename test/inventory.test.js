const test = require('node:test');
const assert = require('node:assert').strict;
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const product = { id: 1, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 80 };

test('check accepts qty 1 when sellable is 1', () => {
  assert.deepEqual(inventory.check([{ ...product, stock: 1, reserved: 0 }], [{ id: 1, qty: 1 }]), {
    ok: true
  });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable is 1', () => {
  assert.deepEqual(inventory.check([{ ...product, stock: 1, reserved: 0 }], [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable is 1', () => {
  assert.deepEqual(inventory.check([{ ...product, stock: 1, reserved: 0 }], [{ id: 1, qty: 0 }]), {
    ok: true
  });
});

test('stock 4 with reserved 3 has one sellable unit and check accepts qty 1', () => {
  const heldProduct = { ...product, stock: 4, reserved: 3 };
  assert.equal(inventory.getSellableStock(heldProduct), 1);
  assert.deepEqual(inventory.check([heldProduct], [{ id: 1, qty: 1 }]), {
    ok: true
  });
});

test('cancelling a pending order restores stock and leaves reserved unchanged', () => {
  const itemProduct = { ...product, stock: 6, reserved: 3 };
  const items = [{
    id: itemProduct.id,
    sku: itemProduct.sku,
    name: itemProduct.name,
    hsn: itemProduct.hsn,
    price: itemProduct.price,
    qty: 2
  }];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [itemProduct], orders: [] };
  const stockSnapshot = () => ({ stock: itemProduct.stock, reserved: itemProduct.reserved });

  const beforeOrder = stockSnapshot();
  inventory.reserve(db.products, items);
  const afterReserve = stockSnapshot();
  db.orders.push(order);
  const result = orders.cancel(db, order.id, 'Cancelled from order desk');
  const afterCancel = stockSnapshot();

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 6, reserved: 3 },
    afterReserve: { stock: 4, reserved: 3 },
    afterCancel: { stock: 6, reserved: 3 }
  });
});

test('sells exactly the remaining sellable stock and restores it once on cancellation', () => {
  const stockedProduct = { ...product, stock: 6, reserved: 3 };
  const products = [stockedProduct];
  const items = [{ ...product, qty: 3 }];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products, orders: [order] };

  const exactQuantity = inventory.check(products, items).ok;
  const excessAcrossLines = inventory.check(products, [
    { ...product, qty: 2 },
    { ...product, qty: 2 }
  ]).ok;

  inventory.reserve(products, items);
  assert.equal(stockedProduct.stock, 3);
  const firstCancel = orders.cancel(db, order.id);
  const stockAfterCancel = stockedProduct.stock;
  const secondCancel = orders.cancel(db, order.id);

  assert.deepEqual({
    exactQuantity,
    excessAcrossLines,
    firstCancel: firstCancel.ok,
    stockAfterCancel,
    secondCancel: secondCancel.ok,
    finalStock: stockedProduct.stock,
    finalReserved: stockedProduct.reserved
  }, {
    exactQuantity: true,
    excessAcrossLines: false,
    firstCancel: true,
    stockAfterCancel: 6,
    secondCancel: false,
    finalStock: 6,
    finalReserved: 3
  });
});
