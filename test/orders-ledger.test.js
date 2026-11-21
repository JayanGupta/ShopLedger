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

test('orders.list sorts mixed DD/MM/YYYY dates newest first', () => {
  const result = orders.list(orderDb(), {});
  assert.deepEqual(result.map((order) => order.date), [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('orders.list applies YYYY-MM-DD from filters chronologically', () => {
  const result = orders.list(orderDb(), { from: '2022-02-01' });
  assert.deepEqual(result.map((order) => order.date), ['15/03/2022']);
});

test('orders.list applies YYYY-MM-DD to filters chronologically', () => {
  const result = orders.list(orderDb(), { to: '2022-02-28' });
  assert.deepEqual(result.map((order) => order.date), ['30/01/2022', '28/12/2021']);
});

test('orders.list applies combined YYYY-MM-DD date filters chronologically', () => {
  const result = orders.list(orderDb(), {
    from: '2021-12-28',
    to: '2022-02-28'
  });
  assert.deepEqual(result.map((order) => order.date), ['30/01/2022', '28/12/2021']);
});

test('dates.normalizeDateKey returns sortable ISO keys for both supported formats', () => {
  assert.equal(dates.normalizeDateKey('2022-02-01'), '2022-02-01');
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '2022-03-15');
  assert.equal(dates.normalizeDateKey(''), '');
  assert.equal(dates.getFiscalYear('15/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('15/04/2022'), 'FY22-23');
});

test('CURRENT BEHAVIOUR: numeric settlement amount updates totals arithmetically', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'upi', 'counter payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements.length, 1);
});

test('numeric string settlement amount updates customer totals numerically', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'counter payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: zero settlement is rejected without changing customer totals', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 0, 'cash', '');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: negative settlement is rejected without changing customer totals', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, -1, 'cash', '');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
});

test('non-numeric string settlement is rejected without changing customer totals', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 'not-a-number', 'cash', '');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('Correct order history dates and numeric Khata settlements', () => {
  const db = orderDb();
  assert.deepEqual(orders.list(db, {}).map((order) => order.date), [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);
  assert.deepEqual(orders.list(db, {
    from: '2022-01-01',
    to: '2022-02-28'
  }).map((order) => order.date), ['30/01/2022']);

  const settlementDb = ledgerDb();
  const settlement = ledger.recordSettlement(settlementDb, 1, '500', 'upi', 'counter payment');
  assert.equal(settlement.ok, true);
  assert.equal(settlement.customer.totalSettled, 1700);
  assert.equal(settlement.customer.balance, 732.01);
  assert.equal(settlement.settlement.amount, 500);

  [0, -1, 'not-a-number'].forEach((amount) => {
    const invalidDb = ledgerDb();
    const result = ledger.recordSettlement(invalidDb, 1, amount, 'cash', '');
    assert.equal(result.ok, false);
    assert.equal(invalidDb.customers[0].totalSettled, 1200);
    assert.equal(invalidDb.settlements.length, 0);
  });
});
