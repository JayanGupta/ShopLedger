var assert = require('node:assert/strict');
var test = require('node:test');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

var product = {
  id: 11, sku: 'SPC-001', name: 'Byadgi Chilli Powder',
  hsn: '0904', price: 220, stock: 4, reserved: 3
};

function lineItem(qty) {
  return {
    id: product.id, sku: product.sku, name: product.name,
    hsn: product.hsn, price: product.price, qty: qty
  };
}

test('accepts quantity 1 when exactly 1 is sellable', function () {
  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [lineItem(1)]), { ok: true });
});

test('rejects quantity 2 when only 1 is sellable', function () {
  assert.equal(inventory.check([product], [lineItem(2)]).ok, false);
});

test('stock helper rejects quantity 0', function () {
  assert.equal(inventory.check([product], [lineItem(0)]).ok, false);
});

test('cancelling a pending order restores physical stock', function () {
  var stock = { ...product };
  var items = [lineItem(1)];
  var db = {
    products: [stock],
    orders: [{ id: 1007, status: 'pending', items: items }]
  };
  var counts = () => ({ stock: stock.stock, reserved: stock.reserved });

  assert.deepEqual(counts(), { stock: 4, reserved: 3 });
  inventory.reserve(db.products, items);
  assert.deepEqual(counts(), { stock: 3, reserved: 3 });
  var result = orders.cancel(db, 1007);
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(counts(), { stock: 4, reserved: 3 });
});

test('sells the exact sellable quantity and restores cancelled stock once', function () {
  var product = { id: 11, name: 'Chilli powder', stock: 4, reserved: 3 };
  var items = [{ id: product.id, qty: 1 }];
  var db = {
    products: [product],
    orders: [{ id: 1007, status: 'pending', items: items }]
  };

  var exactQuantityAllowed = inventory.check(db.products, items).ok;
  var excessQuantityAllowed = inventory.check(db.products, [{ id: product.id, qty: 2 }]).ok;
  var duplicateLinesAllowed = inventory.check(db.products, items.concat(items)).ok;
  var negativeOffsetAllowed = inventory.check(db.products, [
    { id: product.id, qty: -1 },
    { id: product.id, qty: 2 }
  ]).ok;

  inventory.reserve(db.products, items);
  var stockedAfterSale = product.stock;
  var nextSaleAllowed = inventory.check(db.products, items).ok;
  var cancelled = orders.cancel(db, 1007).ok;
  var stockedAfterCancellation = product.stock;
  var cancelledAgain = orders.cancel(db, 1007).ok;

  assert.deepEqual({
    exactQuantityAllowed: exactQuantityAllowed,
    excessQuantityAllowed: excessQuantityAllowed,
    duplicateLinesAllowed: duplicateLinesAllowed,
    negativeOffsetAllowed: negativeOffsetAllowed,
    stockedAfterSale: stockedAfterSale,
    nextSaleAllowed: nextSaleAllowed,
    cancelled: cancelled,
    stockedAfterCancellation: stockedAfterCancellation,
    cancelledAgain: cancelledAgain,
    finalStock: product.stock,
    reserved: product.reserved
  }, {
    exactQuantityAllowed: true,
    excessQuantityAllowed: false,
    duplicateLinesAllowed: false,
    negativeOffsetAllowed: false,
    stockedAfterSale: 3,
    nextSaleAllowed: false,
    cancelled: true,
    stockedAfterCancellation: 4,
    cancelledAgain: false,
    finalStock: 4,
    reserved: 3
  });

  inventory.reserve(db.products, items);
  db.orders.push({
    id: 1008,
    status: 'pending',
    items: [{ id: 99, productId: product.id, qty: 1 }]
  });
  assert.equal(orders.cancel(db, 1008).ok, true);
  assert.equal(product.stock, 4);
  assert.equal(product.reserved, 3);
});
