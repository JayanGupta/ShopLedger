'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');

function makeProducts() {
  return [{ id: 1, name: 'Rice', stock: 5, reserved: 2 }];
}

test('inventory.check allows selling all unreserved stock', function () {
  const result = inventory.check(makeProducts(), [{ id: 1, qty: 3 }]);
  assert.deepEqual(result, { ok: true });
});

test('inventory.check counts repeated product lines together', function () {
  const result = inventory.check(makeProducts(), [
    { id: 1, qty: 2 },
    { id: 1, qty: 2 }
  ]);

  assert.deepEqual(result, {
    ok: false,
    msg: 'Rice is out of stock (3 sellable available)'
  });
});

test('inventory.release restores cancelled order quantities to physical stock', function () {
  const products = makeProducts();
  inventory.reserve(products, [{ id: 1, qty: 3 }]);
  assert.equal(products[0].stock, 2);
  assert.equal(products[0].reserved, 2);

  inventory.release(products, [{ id: 1, qty: 3 }]);

  assert.equal(products[0].stock, 5);
  assert.equal(products[0].reserved, 2);
});
