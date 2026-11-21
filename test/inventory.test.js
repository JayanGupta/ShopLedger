const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('CURRENT BEHAVIOUR: inventory.check accepts qty 1 when sellable stock is 1', function () {
  const products = [{ id: 1, name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 }];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: inventory.check rejects qty 2 when sellable stock is 1', function () {
  const products = [{ id: 1, name: 'Ghee', stock: 1, reserved: 0 }];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 2 }]), {
    ok: false,
    msg: 'Ghee is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: inventory.check accepts qty 0 when sellable stock is 1', function () {
  const products = [{ id: 1, name: 'Ghee', stock: 1, reserved: 0 }];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 0 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: inventory.check accepts qty 1 when stock 4 has 3 reserved', function () {
  const products = [{ id: 2, name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 }];
  assert.deepEqual(inventory.check(products, [{ id: 2, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: cancelling a reserved pending order restores stock once', function () {
  const products = [{ id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 5, reserved: 0 }];
  const orderItems = [{ id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', hsn: '0405', price: 450, qty: 2 }];
  const db = {
    products: products,
    orders: [{ id: 1007, status: 'pending', paymentMode: 'cash', items: orderItems }]
  };
  const before = { stock: products[0].stock, reserved: products[0].reserved };

  inventory.reserve(products, orderItems);
  const afterReserve = { stock: products[0].stock, reserved: products[0].reserved };
  const result = orders.cancel(db, 1007);
  const afterCancel = { stock: products[0].stock, reserved: products[0].reserved };

  assert.deepEqual(before, { stock: 5, reserved: 0 });
  assert.deepEqual(afterReserve, { stock: 3, reserved: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(afterCancel, { stock: 5, reserved: 0 });
});

test('correct behaviour: exact sellable quantity is accepted and cancellation restores it once', function () {
  const products = [{ id: 2, sku: 'SPC-001', name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 }];
  const orderItems = [{ id: 2, sku: 'SPC-001', name: 'Byadgi Kashmiri Chilli Powder 500g', hsn: '0904', price: 200, qty: 1 }];
  const db = {
    products: products,
    orders: [{ id: 1009, status: 'pending', paymentMode: 'cash', items: orderItems }]
  };

  assert.deepEqual(inventory.check(products, orderItems), { ok: true });
  inventory.reserve(products, orderItems);
  assert.deepEqual({ stock: products[0].stock, reserved: products[0].reserved }, { stock: 3, reserved: 3 });
  assert.equal(orders.cancel(db, 1009).ok, true);
  assert.deepEqual({ stock: products[0].stock, reserved: products[0].reserved }, { stock: 4, reserved: 3 });
  assert.equal(orders.cancel(db, 1009).ok, false);
  assert.deepEqual({ stock: products[0].stock, reserved: products[0].reserved }, { stock: 4, reserved: 3 });
});
