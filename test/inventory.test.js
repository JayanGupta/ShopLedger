var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

function product(stock, reserved) {
  return { id: 1, sku: 'TEST-001', name: 'Test product', hsn: '0405',
    price: 450, stock: stock, reserved: reserved };
}

// Match the fields copied onto order lines by routes/orders.js.
function line(p, qty) {
  return { id: p.id, sku: p.sku, name: p.name, hsn: p.hsn, price: p.price, qty: qty };
}

[1, 2, 0].forEach(function (qty) {
  test('CURRENT BEHAVIOUR: stock 1 reserved 0 quantity ' + qty + (qty <= 1 ? ' passes' : ' fails'), function () {
    var p = product(1, 0);
    assert.strictEqual(inventory.getSellableStock(p), 1);
    assert.deepStrictEqual(inventory.check([p], [line(p, qty)]), qty <= 1 ? { ok: true } : {
      ok: false, msg: 'Test product is out of stock (1 sellable available)'
    });
    assert.deepStrictEqual(p, product(1, 0));
  });
});

test('CURRENT BEHAVIOUR: stock 4 reserved 3 allows the last sellable unit', function () {
  var p = product(4, 3);
  assert.strictEqual(inventory.getSellableStock(p), 1);
  assert.deepStrictEqual(inventory.check([p], [line(p, 1)]), { ok: true });
  assert.deepStrictEqual(inventory.check([p], [line(p, 2)]), {
    ok: false, msg: 'Test product is out of stock (1 sellable available)'
  });
  assert.deepStrictEqual(inventory.check([p], [line(p, 0)]), { ok: true });
  assert.deepStrictEqual(p, product(4, 3));
});

test('CURRENT BEHAVIOUR: reserve deducts stock and cancellation restores it once', function () {
  var p = product(8, 3);
  var items = [line(p, 2)];
  var pending = { id: 1007, status: 'pending', paymentMode: 'cash', items: items };
  var db = { products: [p], orders: [pending] };
  var snapshots = [{ stock: p.stock, reserved: p.reserved }];
  assert.deepStrictEqual(inventory.check(db.products, items), { ok: true });
  inventory.reserve(db.products, items);
  snapshots.push({ stock: p.stock, reserved: p.reserved });
  var cancelled = orders.cancel(db, 1007, 'Test cancellation');
  snapshots.push({ stock: p.stock, reserved: p.reserved });
  assert.strictEqual(cancelled.ok, true);
  assert.strictEqual(cancelled.order, pending);
  assert.strictEqual(pending.status, 'cancelled');
  assert.strictEqual(pending.cancelReason, 'Test cancellation');
  assert.match(pending.cancelledAt, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.deepStrictEqual(snapshots, [
    { stock: 8, reserved: 3 },
    { stock: 6, reserved: 3 },
    { stock: 8, reserved: 3 }
  ]);
  assert.deepStrictEqual(orders.cancel(db, 1007), {
    ok: false, error: 'Order #1007 is already cancelled'
  });
  assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, { stock: 8, reserved: 3 });
});

test('last sellable units can be sold and cancellation restores stock exactly once', function () {
  [product(1, 0), product(4, 3)].forEach(function (p) {
    var initial = { stock: p.stock, reserved: p.reserved };
    var items = [line(p, 1)];
    var db = { products: [p], orders: [{
      id: 42, status: 'pending', paymentMode: 'cash', items: items
    }] };
    assert.strictEqual(inventory.check(db.products, [line(p, 2)]).ok, false);
    assert.deepStrictEqual(inventory.check(db.products, items), { ok: true });
    inventory.reserve(db.products, items);
    assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, {
      stock: initial.stock - 1, reserved: initial.reserved
    });
    assert.strictEqual(inventory.getSellableStock(p), 0);
    assert.strictEqual(inventory.check(db.products, items).ok, false);
    assert.strictEqual(orders.cancel(db, 42).ok, true);
    assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, initial);
    assert.strictEqual(orders.cancel(db, 42).ok, false);
    assert.deepStrictEqual({ stock: p.stock, reserved: p.reserved }, initial);
  });
  // Separate duplicate lines must not collectively exceed sellable stock.
  var duplicate = product(1, 0);
  assert.strictEqual(inventory.check([duplicate], [line(duplicate, 1), line(duplicate, 1)]).ok, false);
});
