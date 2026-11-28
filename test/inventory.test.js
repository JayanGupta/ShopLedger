'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('INVENTORY REGRESSION: an order equal to sellable stock is accepted', function () {
  const products = [{ id: 7, name: 'Test item', stock: 5, reserved: 1 }];

  assert.deepEqual(inventory.check(products, [{ id: 7, qty: 4 }]), { ok: true });
});

test('INVENTORY REGRESSION: cancelling an order restores its physical stock once', function () {
  const db = {
    products: [{ id: 7, name: 'Test item', stock: 8, reserved: 2 }],
    orders: [{ id: 101, status: 'completed', paymentMode: 'cash', items: [{ id: 7, qty: 2 }] }]
  };

  const result = orders.cancel(db, 101, 'Customer changed mind');

  assert.equal(result.ok, true);
  assert.equal(db.products[0].stock, 10);
  assert.equal(db.products[0].reserved, 2);
  assert.equal(orders.cancel(db, 101).ok, false);
  assert.equal(db.products[0].stock, 10);
});
