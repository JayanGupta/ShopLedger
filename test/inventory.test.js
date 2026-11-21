const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('CURRENT BEHAVIOUR: check accepts qty 1 when sellable stock is 1', () => {
  const product = { id: 1, name: 'Rice', stock: 1, reserved: 0 };

  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 1 }]), {
    ok: true
  });
});

test('CURRENT BEHAVIOUR: check rejects qty 2 when sellable stock is 1', () => {
  const product = { id: 1, name: 'Rice', stock: 1, reserved: 0 };

  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 2 }]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable stock is 1', () => {
  const product = { id: 1, name: 'Rice', stock: 1, reserved: 0 };

  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 0 }]), {
    ok: true
  });
});

test('CURRENT BEHAVIOUR: check accepts qty 1 with stock 4 and reserved 3', () => {
  const product = { id: 1, name: 'Rice', stock: 4, reserved: 3 };

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 1 }]), {
    ok: true
  });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores physical stock', () => {
  const product = {
    id: 1,
    sku: 'RICE-001',
    name: 'Rice',
    hsn: '1006',
    price: 100,
    stock: 6,
    reserved: 3
  };
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 2
  }];
  const db = { products: [product], orders: [] };
  const beforeOrder = { stock: product.stock, reserved: product.reserved };

  inventory.reserve(db.products, items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };
  db.orders.push({ id: 1001, status: 'pending', paymentMode: 'cash', items });

  const result = orders.cancel(db, 1001, 'Cancelled at the counter');
  const afterCancel = { stock: product.stock, reserved: product.reserved };

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 6, reserved: 3 },
    afterReserve: { stock: 4, reserved: 3 },
    afterCancel: { stock: 6, reserved: 3 }
  });
});

test('sells exactly the sellable stock across lines and restores it only once', () => {
  const product = {
    id: 1,
    sku: 'RICE-001',
    name: 'Rice',
    hsn: '1006',
    price: 100,
    stock: 6,
    reserved: 3
  };
  const items = [1, 2].map(qty => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty
  }));
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  const exactQtyAccepted = inventory.check(db.products, items).ok;
  const excessQtyAccepted = inventory.check(db.products, [items[1], items[1]]).ok;
  inventory.reserve(db.products, items);
  const stockAfterSale = product.stock;
  const cancelled = orders.cancel(db, order.id).ok;
  const stockAfterCancel = product.stock;
  const cancelledAgain = orders.cancel(db, order.id).ok;

  assert.deepEqual({
    exactQtyAccepted,
    excessQtyAccepted,
    stockAfterSale,
    cancelled,
    stockAfterCancel,
    cancelledAgain,
    stockAfterSecondCancel: product.stock,
    wholesaleHold: product.reserved
  }, {
    exactQtyAccepted: true,
    excessQtyAccepted: false,
    stockAfterSale: 3,
    cancelled: true,
    stockAfterCancel: 6,
    cancelledAgain: false,
    stockAfterSecondCancel: 6,
    wholesaleHold: 3
  });
});
