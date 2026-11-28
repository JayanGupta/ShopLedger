// Characterization tests for Ticket 3 (CP3).
//
// These tests pin the behaviour the code has TODAY, before any fix, so a later
// change can be checked against them. Tests whose name starts with
// "CURRENT BEHAVIOUR:" describe behaviour that is WRONG (that is the ticket);
// they are updated — not deleted — when the fix lands.
//
// In-memory data only: these tests never read or write data/db.json and do
// not need the server or any npm dependency (lib/inventory.js needs only
// ../config; lib/orders.js needs only ./dates, ./inventory, ./ledger).

var test = require('node:test');
var assert = require('node:assert');

var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

function product(overrides) {
  var p = {
    id: 1,
    sku: 'TST-001',
    name: 'Test Rice 5kg',
    category: 'Staples & Grains',
    unit: 'bag',
    hsn: '1006',
    price: 100,
    stock: 0,
    reserved: 0,
    reorderLevel: 10
  };
  Object.keys(overrides || {}).forEach(function (k) { p[k] = overrides[k]; });
  return p;
}

// A pending order for 2 units of product 1, in a shop whose physical stock is
// already down to 3 because reserve() deducted those 2 units when the order
// was placed (5 - 2 = 3). This mirrors the real flow in routes/orders.js.
function dbWithPendingOrder() {
  return {
    products: [product({ stock: 3, reserved: 0 })],
    orders: [{
      id: 1001,
      date: '28/11/2026',
      customer: 'Walk-in',
      customerId: null,
      paymentMode: 'cash',
      status: 'pending',
      items: [{ id: 1, sku: 'TST-001', name: 'Test Rice 5kg', hsn: '1006', price: 100, qty: 2 }],
      coupon: '',
      subtotal: 200,
      discount: 0,
      tax: 10,
      total: 210
    }],
    customers: [],
    settlements: [],
    auditLog: [],
    nextOrderId: 1002,
    nextSettlementId: 501
  };
}

// ---------- getSellableStock ----------

test('getSellableStock: physical 1, reserved 0 gives 1', function () {
  assert.strictEqual(inventory.getSellableStock(product({ stock: 1, reserved: 0 })), 1);
});

test('getSellableStock: physical 4, reserved 3 gives 1', function () {
  assert.strictEqual(inventory.getSellableStock(product({ stock: 4, reserved: 3 })), 1);
});

test('getSellableStock: unknown product gives 0', function () {
  assert.strictEqual(inventory.getSellableStock(null), 0);
});

// ---------- inventory.check ----------

test('check accepts qty 1 when sellable is exactly 1 (the last sellable unit)', function () {
  // Was "CURRENT BEHAVIOUR: check rejects qty 1 when sellable is exactly 1"
  // before the Ticket 3 fix (check used qty >= sellable).
  var products = [product({ stock: 4, reserved: 3 })]; // sellable = 1
  var res = inventory.check(products, [{ id: 1, qty: 1 }]);
  assert.deepStrictEqual(res, { ok: true });
});

test('check rejects qty above sellable', function () {
  var products = [product({ stock: 4, reserved: 3 })]; // sellable = 1
  var res = inventory.check(products, [{ id: 1, qty: 2 }]);
  assert.strictEqual(res.ok, false);
});

test('check accepts qty below sellable', function () {
  var products = [product({ stock: 5, reserved: 0 })]; // sellable = 5
  var res = inventory.check(products, [{ id: 1, qty: 2 }]);
  assert.deepStrictEqual(res, { ok: true });
});

test('check rejects an unknown product', function () {
  var products = [product({ stock: 5, reserved: 0 })];
  var res = inventory.check(products, [{ id: 99, qty: 1 }]);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.msg, 'Unknown product 99');
});

// ---------- inventory.reserve (what cancel must undo) ----------

test('reserve deducts the ordered qty from physical stock', function () {
  var products = [product({ stock: 5, reserved: 0 })];
  inventory.reserve(products, [{ id: 1, qty: 2 }]);
  assert.strictEqual(products[0].stock, 3);
});

// ---------- orders.cancel ----------

test('cancelling a pending order returns its items to stock', function () {
  // Was "CURRENT BEHAVIOUR: cancelling a pending order does not return items
  // to stock" before the Ticket 3 fix (release looked up productId and
  // decremented reserved instead of returning units to stock).
  var db = dbWithPendingOrder();
  var res = orders.cancel(db, 1001, 'Customer changed mind');

  assert.strictEqual(res.ok, true);
  assert.strictEqual(db.orders[0].status, 'cancelled');
  // The 2 units deducted when the order was placed come back: 3 + 2 = 5.
  assert.strictEqual(db.products[0].stock, 5);
  assert.strictEqual(inventory.getSellableStock(db.products[0]), 5);
});

test('cancel of an already-cancelled order is an error', function () {
  var db = dbWithPendingOrder();
  orders.cancel(db, 1001);
  var res = orders.cancel(db, 1001);
  assert.strictEqual(res.ok, false);
});

// ---------- Ticket 3: the CORRECT behaviour (added at CP4, before the fix) ----------

test('Ticket 3: last sellable unit can be sold and cancel returns items to stock', function () {
  // Buying exactly the sellable amount must be allowed (qty == sellable).
  var products = [product({ stock: 4, reserved: 3 })]; // sellable = 1
  var res = inventory.check(products, [{ id: 1, qty: 1 }]);
  assert.strictEqual(res.ok, true);

  // Cancelling the pending order must give its 2 units back:
  // stock was 5, reserve() took it to 3, cancel must return it to 5.
  var db = dbWithPendingOrder();
  var cancelRes = orders.cancel(db, 1001, 'Customer changed mind');
  assert.strictEqual(cancelRes.ok, true);
  assert.strictEqual(db.products[0].stock, 5);
  assert.strictEqual(inventory.getSellableStock(db.products[0]), 5);
});
