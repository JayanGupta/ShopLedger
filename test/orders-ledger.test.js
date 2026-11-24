'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderDb() {
  return {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' }
    ]
  };
}

function ledgerDb() {
  return {
    customers: [{
      id: 7,
      name: 'Test Customer',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('FIXED BEHAVIOUR: order dates and settlement amounts use chronological numeric values', function () {
  const db = orderDb();
  assert.deepEqual(orders.list(db).map(function (order) { return order.id; }), [1, 2, 3]);
  assert.deepEqual(orders.list(db, { from: '2022-03-01' }).map(function (order) { return order.id; }), [1]);
  assert.deepEqual(orders.list(db, { to: '2022-02-28' }).map(function (order) { return order.id; }), [2, 3]);

  const meeraDb = ledgerDb();
  Object.assign(meeraDb.customers[0], {
    name: 'Meera Joshi', openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200
  });
  const settlement = ledger.recordSettlement(meeraDb, 7, '500', 'cash', 'payment');
  assert.equal(settlement.ok, true);
  assert.equal(meeraDb.customers[0].totalSettled, 1700);
  assert.equal(meeraDb.customers[0].balance, 732.01);

  [0, -10, 'not-a-number', ''].forEach(function (amount) {
    const invalidDb = ledgerDb();
    const before = structuredClone(invalidDb.customers[0]);
    const result = ledger.recordSettlement(invalidDb, 7, amount);
    assert.equal(result.ok, false);
    assert.deepEqual(invalidDb.customers[0], before);
    assert.equal(invalidDb.settlements.length, 0);
  });
});

test('FIXED BEHAVIOUR: orders.list sorts mixed DD/MM/YYYY dates newest first', function () {
  const result = orders.list(orderDb());
  assert.deepEqual(result.map(function (order) { return order.id; }), [1, 2, 3]);
});

test('FIXED BEHAVIOUR: orders.list from filter compares real dates from YYYY-MM-DD input', function () {
  const result = orders.list(orderDb(), { from: '2022-03-01' });
  assert.deepEqual(result.map(function (order) { return order.id; }), [1]);
});

test('FIXED BEHAVIOUR: orders.list to filter includes dates on or before YYYY-MM-DD input', function () {
  const result = orders.list(orderDb(), { to: '2022-02-28' });
  assert.deepEqual(result.map(function (order) { return order.id; }), [2, 3]);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey converts YYYY-MM-DD but leaves DD/MM/YYYY and empty input unchanged', function () {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey('15/03/2022'), '15/03/2022');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: recordSettlement subtracts a numeric amount and updates the balance', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 7, 500, 'cash', 'payment');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements.length, 1);
});

test('FIXED BEHAVIOUR: recordSettlement treats a JSON string amount as a number', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 7, '500', 'cash', 'payment');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: recordSettlement rejects a zero amount without changing the customer', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 7, 0);

  assert.equal(result.ok, false);
  assert.deepEqual(db.customers[0], ledgerDb().customers[0]);
  assert.equal(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: recordSettlement rejects a negative amount without changing the customer', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 7, -10);

  assert.equal(result.ok, false);
  assert.deepEqual(db.customers[0], ledgerDb().customers[0]);
  assert.equal(db.settlements.length, 0);
});

test('FIXED BEHAVIOUR: recordSettlement rejects a non-numeric string without changing the customer', function () {
  const db = ledgerDb();
  const before = Object.assign({}, db.customers[0]);
  const result = ledger.recordSettlement(db, 7, 'not-a-number');

  assert.equal(result.ok, false);
  assert.deepEqual(db.customers[0], before);
  assert.equal(db.settlements.length, 0);
});
