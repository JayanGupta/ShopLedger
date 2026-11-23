const test = require('node:test');
const assert = require('node:assert').strict;
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('allows exactly the sellable stock and restores a cancelled order exactly once', function () {
  const db = {
    nextOrderId: 1001,
    products: [{ id: 1, name: 'Test product', stock: 7, reserved: 2 }],
    orders: [],
    customers: []
  };
  const product = db.products[0];

  assert.strictEqual(inventory.getSellableStock(product), 5);
  assert.deepStrictEqual(
    inventory.check(db.products, [{ id: 1, qty: 5 }]),
    { ok: true },
    'all remaining sellable units can be purchased'
  );
  assert.strictEqual(
    inventory.check(db.products, [{ id: 1, qty: 6 }]).ok,
    false,
    'a single line cannot consume reserved stock'
  );
  assert.strictEqual(
    inventory.check(db.products, [{ id: 1, qty: 3 }, { id: '1', qty: 3 }]).ok,
    false,
    'duplicate product lines share the same stock, including numeric/string IDs'
  );

  const items = [{ id: 1, qty: 2 }, { id: '1', qty: 3 }];
  assert.deepStrictEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  assert.strictEqual(product.stock, 2);
  assert.strictEqual(product.reserved, 2);
  assert.strictEqual(inventory.getSellableStock(product), 0);
  assert.strictEqual(inventory.check(db.products, [{ id: 1, qty: 1 }]).ok, false);

  const order = orders.add(db, { items: items, paymentMode: 'cash', total: 100 });
  const cancelled = orders.cancel(db, order.id, 'Test cancellation');
  assert.strictEqual(cancelled.ok, true);
  assert.strictEqual(order.status, 'cancelled');
  assert.strictEqual(product.stock, 7, 'cancellation restores all sold quantities');
  assert.strictEqual(product.reserved, 2, 'wholesale reservations remain unchanged');
  assert.strictEqual(inventory.getSellableStock(product), 5);

  const repeated = orders.cancel(db, order.id, 'Repeat cancellation');
  assert.strictEqual(repeated.ok, false);
  assert.match(repeated.error, /already cancelled/);
  assert.strictEqual(product.stock, 7, 'a repeated cancellation cannot add stock twice');
  assert.strictEqual(product.reserved, 2);
});
