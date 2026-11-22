const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

// Match the saved line fields constructed by routes/orders.js.
function lineItem(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: qty
  };
}

test('Buying all sellable units respects reservations and cancellation restores stock exactly once', () => {
  const product = { id: 1, sku: 'TEST-001', name: 'Test product', hsn: '1006', price: 100, stock: 4, reserved: 3 };
  const items = [lineItem(product, 1)];
  const db = {
    products: [product],
    orders: [{ id: 1001, status: 'pending', paymentMode: 'cash', items: items }]
  };

  assert.deepStrictEqual(inventory.check(db.products, items), { ok: true });
  assert.equal(inventory.check(db.products, [lineItem(product, 2)]).ok, false);
  assert.equal(inventory.check(db.products, [lineItem(product, 1), lineItem(product, 1)]).ok, false);
  inventory.reserve(db.products, items);
  assert.deepStrictEqual([product.stock, product.reserved], [3, 3]);
  assert.equal(inventory.check(db.products, items).ok, false);
  assert.equal(orders.cancel(db, 1001, 'Test cancellation').ok, true);
  assert.deepStrictEqual([product.stock, product.reserved], [4, 3]);
  assert.deepStrictEqual(orders.cancel(db, 1001, 'Repeat cancellation'), {
    ok: false, error: 'Order #1001 is already cancelled'
  });
  assert.deepStrictEqual([product.stock, product.reserved], [4, 3]);
});

for (const stockCase of [
  { name: 'stock 1 reserved 0', stock: 1, reserved: 0 },
  { name: 'stock 4 reserved 3', stock: 4, reserved: 3 }
]) {
  for (const qty of [1, 2, 0]) {
    test('CURRENT BEHAVIOUR: ' + stockCase.name + ' with qty ' + qty, () => {
      const product = {
        id: 1,
        sku: 'TEST-001',
        name: 'Test product',
        hsn: '1006',
        price: 100,
        stock: stockCase.stock,
        reserved: stockCase.reserved
      };
      const products = [product];
      const items = [lineItem(product, qty)];
      const before = structuredClone({ products, items });

      assert.equal(inventory.getSellableStock(product), 1);
      const result = inventory.check(products, items);
      if (qty <= 1) {
        assert.deepStrictEqual(result, { ok: true });
      } else {
        assert.deepStrictEqual(result, {
          ok: false,
          msg: 'Test product is out of stock (1 sellable available)'
        });
      }
      assert.deepStrictEqual({ products, items }, before);
    });
  }
}

test('CURRENT BEHAVIOUR: reserve deducts stock and cancelling a pending order restores it', () => {
  const product = {
    id: 1,
    sku: 'TEST-001',
    name: 'Test product',
    hsn: '1006',
    price: 100,
    stock: 4,
    reserved: 1
  };
  const items = [lineItem(product, 2)];
  const order = {
    id: 1001,
    date: '15/03/2022',
    customer: 'Walk-in',
    customerId: null,
    paymentMode: 'cash',
    status: 'pending',
    items: items,
    coupon: '',
    subtotal: 200,
    discount: 0,
    tax: 10,
    total: 210
  };
  const db = { products: [product], orders: [order] };
  const stages = [{ stage: 'before order', stock: product.stock, reserved: product.reserved }];
  const originalItems = structuredClone(items);

  assert.deepStrictEqual(Object.keys(items[0]), ['id', 'sku', 'name', 'hsn', 'price', 'qty']);
  assert.deepStrictEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  stages.push({ stage: 'after reserve', stock: product.stock, reserved: product.reserved });
  assert.equal(order.status, 'pending');

  const result = orders.cancel(db, order.id, 'Test cancellation');
  stages.push({ stage: 'after cancel', stock: product.stock, reserved: product.reserved });

  assert.deepStrictEqual(stages, [
    { stage: 'before order', stock: 4, reserved: 1 },
    { stage: 'after reserve', stock: 2, reserved: 1 },
    { stage: 'after cancel', stock: 4, reserved: 1 }
  ]);
  assert.equal(result.ok, true);
  assert.strictEqual(result.order, order);
  assert.equal(order.status, 'cancelled');
  assert.equal(order.cancelReason, 'Test cancellation');
  assert.match(order.cancelledAt, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.deepStrictEqual(order.items, originalItems);
});
