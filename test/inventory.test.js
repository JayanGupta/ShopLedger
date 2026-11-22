const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function makeProduct(stock, reserved = 0) {
  return {
    id: 1,
    sku: 'RICE-1',
    name: 'Rice',
    hsn: '1006',
    price: 100,
    stock,
    reserved
  };
}

function makeOrderLine(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty
  };
}

test('accepts the last sellable unit', () => {
  const product = makeProduct(1);

  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 1)]), {
    ok: true
  });
});

test('CURRENT BEHAVIOUR: rejects two units when one is sellable', () => {
  const product = makeProduct(1);

  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 2)]), {
    ok: false,
    msg: 'Rice is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: accepts zero units when one is sellable', () => {
  const product = makeProduct(1);

  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 0)]), {
    ok: true
  });
});

test('accepts the one sellable unit when three of four are reserved', () => {
  const product = makeProduct(4, 3);

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 1)]), {
    ok: true
  });
});

test('cancelling a pending order restores stock and preserves reserved units', () => {
  const product = makeProduct(4, 2);
  const items = [makeOrderLine(product, 1)];
  const db = { products: [product], orders: [] };
  const snapshot = () => ({ stock: product.stock, reserved: product.reserved });

  const beforeOrder = snapshot();
  inventory.reserve(db.products, items);
  const afterReserve = snapshot();

  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);
  const result = orders.cancel(db, order.id);
  const afterCancel = snapshot();

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual({ beforeOrder, afterReserve, afterCancel }, {
    beforeOrder: { stock: 4, reserved: 2 },
    afterReserve: { stock: 3, reserved: 2 },
    afterCancel: { stock: 4, reserved: 2 }
  });
});


test('allows exactly the sellable stock and restores it only once on cancellation', () => {
  const product = makeProduct(5, 2);
  const items = [makeOrderLine(product, 1), makeOrderLine(product, 2)];
  const tooMany = [makeOrderLine(product, 2), makeOrderLine(product, 2)];
  const db = { products: [product], orders: [] };

  const exact = inventory.check(db.products, [makeOrderLine(product, 3)]).ok;
  const exactSplit = inventory.check(db.products, items).ok;
  const over = inventory.check(db.products, tooMany).ok;
  inventory.reserve(db.products, items);
  const afterReserve = [product.stock, product.reserved];

  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  db.orders.push(order);
  const cancelled = orders.cancel(db, order.id).ok;
  const afterCancel = [product.stock, product.reserved];
  const cancelledAgain = orders.cancel(db, order.id).ok;
  const afterSecondCancel = [product.stock, product.reserved];

  assert.deepEqual(
    { exact, exactSplit, over, afterReserve, cancelled, afterCancel, cancelledAgain, afterSecondCancel },
    {
      exact: true,
      exactSplit: true,
      over: false,
      afterReserve: [2, 2],
      cancelled: true,
      afterCancel: [5, 2],
      cancelledAgain: false,
      afterSecondCancel: [5, 2]
    }
  );
});
