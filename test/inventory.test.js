var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

function ghee(stock, reserved) {
  return {
    id: 6,
    sku: 'DRY-001',
    name: 'A2 Gir Cow Ghee 500ml',
    hsn: '0405',
    price: 450,
    stock: stock,
    reserved: reserved
  };
}

function chilli() {
  return {
    id: 11,
    sku: 'SPC-001',
    name: 'Byadgi Kashmiri Chilli Powder 500g',
    hsn: '0904',
    price: 220,
    stock: 4,
    reserved: 3
  };
}

function item(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: qty
  };
}

describe('inventory.check', function () {
  it('allows exactly the last sellable unit and rejects more', function () {
    var products = [ghee(1, 0)];
    assert.equal(inventory.check(products, [item(products[0], 1)]).ok, true);
    var tooMany = inventory.check(products, [item(products[0], 2)]);
    assert.equal(tooMany.ok, false);
    assert.match(tooMany.msg, /1 sellable available/);
    assert.equal(inventory.check(products, [item(products[0], 0)]).ok, true);
  });

  it('treats reserved units as not sellable', function () {
    var products = [chilli()];
    assert.equal(inventory.getSellableStock(products[0]), 1);
    assert.equal(inventory.check(products, [item(products[0], 1)]).ok, true);
    assert.equal(inventory.check(products, [item(products[0], 2)]).ok, false);
  });
});

describe('orders.cancel stock', function () {
  it('returns reserved units to stock exactly once', function () {
    var product = ghee(5, 1);
    var oil = {
      id: 4,
      sku: 'OIL-001',
      name: 'Cold-Pressed Sunflower Oil 1L',
      hsn: '1512',
      price: 190,
      stock: 22,
      reserved: 4
    };
    var db = {
      nextOrderId: 2001,
      products: [product, oil],
      orders: []
    };
    var lines = [item(product, 2), item(oil, 2)];

    assert.deepEqual(
      db.products.map(function (p) { return [p.stock, p.reserved]; }),
      [[5, 1], [22, 4]]
    );

    inventory.reserve(db.products, lines);
    assert.deepEqual(
      db.products.map(function (p) { return [p.stock, p.reserved]; }),
      [[3, 1], [20, 4]]
    );

    var order = orders.add(db, {
      customer: 'Suresh Deshmukh',
      paymentMode: 'cash',
      status: 'pending',
      items: lines,
      subtotal: 1280,
      discount: 0,
      tax: 127,
      total: 1407
    });

    var cancelled = orders.cancel(db, order.id, 'desk');
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.order.status, 'cancelled');
    assert.deepEqual(
      db.products.map(function (p) { return [p.stock, p.reserved]; }),
      [[5, 1], [22, 4]]
    );

    var again = orders.cancel(db, order.id, 'desk');
    assert.equal(again.ok, false);
    assert.deepEqual(
      db.products.map(function (p) { return [p.stock, p.reserved]; }),
      [[5, 1], [22, 4]]
    );
  });
});
