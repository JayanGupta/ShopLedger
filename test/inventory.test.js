const test = require('node:test');
const assert = require('node:assert').strict;
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

// Synthetic fixtures only: never import store or load the application's database.
function product(stock, reserved) {
  return { id: 1, sku: 'TEST-1', name: 'Test rice', hsn: '1006',
    price: 100, stock: stock, reserved: reserved };
}

// Same six fields stored by routes/orders.js (no productId field).
function lineItem(p, qty) {
  return { id: p.id, sku: p.sku, name: p.name, hsn: p.hsn,
    price: p.price, qty: qty };
}

for (const fixture of [
  { label: 'stock 1, reserved 0', stock: 1, reserved: 0 },
  { label: 'stock 4, reserved 3', stock: 4, reserved: 3 }
]) {
  for (const qty of [1, 2, 0]) {
    const accepted = qty <= 1;
    test('CURRENT BEHAVIOUR: ' + fixture.label + ', qty ' + qty +
      (accepted ? ' passes' : ' is rejected'), function () {
      const p = product(fixture.stock, fixture.reserved);
      const before = { ...p };
      assert.equal(inventory.getSellableStock(p), 1);
      assert.deepEqual(inventory.check([p], [lineItem(p, qty)]), accepted
        ? { ok: true }
        : { ok: false, msg: 'Test rice is out of stock (1 sellable available)' });
      assert.deepEqual(p, before, 'checking stock does not mutate the product');
    });
  }
}

test('CURRENT BEHAVIOUR: pending order cancellation restores deducted stock', function (t) {
  const p = product(6, 3);
  const items = [lineItem(p, 2)];
  const db = { products: [p], orders: [] };
  const snapshot = () => ({ stock: p.stock, reserved: p.reserved });
  const stages = { beforeOrder: snapshot() };

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  stages.afterReserve = snapshot();
  const order = { id: 1001, status: 'pending', paymentMode: 'cash',
    customerId: null, items: items };
  db.orders.push(order);

  const result = orders.cancel(db, order.id, 'Characterization cancellation');
  stages.afterCancel = snapshot();
  assert.equal(result.ok, true);
  assert.equal(result.order, order);
  assert.equal(order.status, 'cancelled');
  assert.equal(order.cancelReason, 'Characterization cancellation');
  assert.match(order.cancelledAt, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.deepEqual(stages, {
    beforeOrder: { stock: 6, reserved: 3 },
    afterReserve: { stock: 4, reserved: 3 },
    afterCancel: { stock: 6, reserved: 3 }
  });
  t.diagnostic(JSON.stringify(stages));
});

test('sells the last sellable unit, rejects excess across lines, and restores stock once', function () {
  const p = product(4, 3);
  const items = [lineItem(p, 1)];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [p], orders: [order] };
  const other = product(6, 3);
  const splitItems = [lineItem(other, 2), lineItem(other, 2)];

  const acceptsLastUnit = inventory.check(db.products, items).ok;
  const acceptsSplitOversell = inventory.check([other], splitItems).ok;
  inventory.reserve(db.products, items);
  const afterSale = { stock: p.stock, reserved: p.reserved };
  const firstCancel = orders.cancel(db, order.id, 'Test cancellation').ok;
  const afterFirstCancel = { stock: p.stock, reserved: p.reserved };
  const secondCancel = orders.cancel(db, order.id, 'Retry cancellation').ok;
  const afterSecondCancel = { stock: p.stock, reserved: p.reserved };

  assert.deepEqual({
    acceptsLastUnit, acceptsSplitOversell, afterSale, firstCancel,
    afterFirstCancel, secondCancel, afterSecondCancel
  }, {
    acceptsLastUnit: true,
    acceptsSplitOversell: false,
    afterSale: { stock: 3, reserved: 3 },
    firstCancel: true,
    afterFirstCancel: { stock: 4, reserved: 3 },
    secondCancel: false,
    afterSecondCancel: { stock: 4, reserved: 3 }
  });
});
