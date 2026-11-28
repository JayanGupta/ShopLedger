'use strict';

const test = require('node:test');
const assert = require('node:assert');
const dates = require('../lib/dates');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

function orderDb() {
  return {
    orders: [
      { id: 1008, date: '15/03/2022' },
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' }
    ]
  };
}

function customerDb() {
  return {
    nextSettlementId: 505,
    settlements: [],
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }]
  };
}

test('EXPECTED BEHAVIOUR: date ordering, date range, and settlement amounts are correct', function () {
  const db = orderDb();
  const newestFirst = orders.list(db);
  assert.deepEqual(newestFirst.map(function (order) { return order.id; }), [1008, 1004, 1001]);

  const january = orders.list(db, { from: '2022-01-01', to: '2022-01-31' });
  assert.deepEqual(january.map(function (order) { return order.id; }), [1004]);
  assert.equal(dates.normalizeDateKey('30/01/2022'), '2022-01-30');

  const customerData = customerDb();
  const settlement = ledger.recordSettlement(customerData, 1, '500');
  assert.equal(settlement.ok, true);
  assert.equal(settlement.customer.totalSettled, 1700);
  assert.equal(settlement.customer.balance, 732.01);

  ['0', '-500', 'not-a-number', true].forEach(function (amount) {
    const invalid = ledger.recordSettlement(customerData, 1, amount);
    assert.equal(invalid.ok, false, 'amount ' + amount + ' should be rejected');
  });
  assert.equal(customerData.customers[0].totalSettled, 1700);
  assert.equal(customerData.customers[0].balance, 732.01);
  assert.equal(customerData.settlements.length, 1);
});

test('EXPECTED BEHAVIOUR: orders.list returns mixed-format dates newest first', function () {
  const result = orders.list(orderDb());
  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('EXPECTED BEHAVIOUR: orders.list applies YYYY-MM-DD range filters to DD/MM/YYYY order dates', function () {
  const result = orders.list(orderDb(), { from: '2022-01-01', to: '2022-01-31' });
  assert.deepEqual(result.map(function (order) { return order.id; }), [1004]);
});

test('EXPECTED BEHAVIOUR: dates.normalizeDateKey converts DD/MM/YYYY into a sortable key', function () {
  assert.equal(dates.normalizeDateKey('15/03/2022'), '2022-03-15');
});

test('EXPECTED BEHAVIOUR: dates.normalizeDateKey leaves YYYY-MM-DD as a sortable key', function () {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '2022-03-15');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement calculates totals correctly for numeric amount 500', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('EXPECTED BEHAVIOUR: ledger.recordSettlement treats string amount "500" as a number', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects a zero amount without changing the customer', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 0);

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
  assert.equal(db.nextSettlementId, 505);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects a negative amount without changing the customer', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, -500);

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
  assert.equal(db.nextSettlementId, 505);
});

test('EXPECTED BEHAVIOUR: ledger.recordSettlement rejects non-numeric text without changing the customer', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 'not-a-number');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
  assert.equal(db.nextSettlementId, 505);
});
