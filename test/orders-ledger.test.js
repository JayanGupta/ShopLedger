'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function makeOrdersDb() {
  return {
    orders: [
      { id: 1001, date: '15/03/2022' },
      { id: 1002, date: '30/01/2022' },
      { id: 1003, date: '28/12/2021' }
    ]
  };
}

function makeLedgerDb() {
  return {
    nextSettlementId: 501,
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: []
  };
}

test('CURRENT BEHAVIOUR: orders.list sorts mixed DD/MM/YYYY dates newest first', function () {
  const result = orders.list(makeOrdersDb());
  assert.deepEqual(result.map(function (order) { return order.date; }), [
    '15/03/2022', '30/01/2022', '28/12/2021'
  ]);
});

test('CURRENT BEHAVIOUR: orders.list from filter accepts date-picker YYYY-MM-DD', function () {
  const result = orders.list(makeOrdersDb(), { from: '2022-01-01' });
  assert.deepEqual(result.map(function (order) { return order.date; }), [
    '15/03/2022', '30/01/2022'
  ]);
});

test('CURRENT BEHAVIOUR: orders.list to filter accepts date-picker YYYY-MM-DD', function () {
  const result = orders.list(makeOrdersDb(), { to: '2022-01-31' });
  assert.deepEqual(result.map(function (order) { return order.date; }), [
    '30/01/2022', '28/12/2021'
  ]);
});

test('CURRENT BEHAVIOUR: orders.list applies an inclusive combined date-picker range chronologically', function () {
  const result = orders.list(makeOrdersDb(), {
    from: '2022-01-01',
    to: '2022-03-01'
  });
  assert.deepEqual(result.map(function (order) { return order.date; }), ['30/01/2022']);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey normalizes supported and invalid dates', function () {
  assert.equal(dates.normalizeDateKey('15/03/2022'), '2022-03-15');
  assert.equal(dates.normalizeDateKey('2022-03-15'), '2022-03-15');
  assert.equal(dates.normalizeDateKey('30/02/2022'), '');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement adds numeric 500 and recalculates balance', function () {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 7, 500, 'cash', 'part payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
  assert.equal(db.settlements.length, 1);
  assert.equal(db.nextSettlementId, 502);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement adds JSON string "500" as numeric 500', function () {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 7, '500', 'cash', 'part payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects zero without changing totals', function () {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 7, 0);

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
  assert.equal(db.nextSettlementId, 501);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects a negative amount without changing totals', function () {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 7, -500);

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
  assert.equal(db.nextSettlementId, 501);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects non-numeric text without changing totals', function () {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 7, 'not-a-number');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
  assert.equal(db.nextSettlementId, 501);
});
