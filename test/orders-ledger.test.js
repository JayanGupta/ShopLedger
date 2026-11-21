'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

const orderDb = {
  orders: [
    { id: 1, date: '15/03/2022' },
    { id: 2, date: '30/01/2022' },
    { id: 3, date: '28/12/2021' }
  ]
};

function makeLedgerDb() {
  return {
    customers: [{
      id: 1,
      name: 'Test customer',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('order history sorts newest first across months and years', () => {
  assert.deepEqual(orders.list(orderDb).map(order => order.id), [1, 2, 3]);
});

test('order history applies inclusive chronological picker bounds', () => {
  const from = '2022-01-30';
  const to = '2022-03-15';

  assert.deepEqual(orders.list(orderDb, { from }).map(order => order.id), [1, 2]);
  assert.deepEqual(orders.list(orderDb, { to }).map(order => order.id), [1, 2, 3]);
  assert.deepEqual(orders.list(orderDb, { from, to }).map(order => order.id), [1, 2]);
});

test('CURRENT BEHAVIOUR: normalizeDateKey trims and converts picker dates without validation', () => {
  assert.equal(dates.normalizeDateKey(' 2022-03-15 '), '15/03/2022');
  assert.equal(dates.normalizeDateKey(' 30/01/2022 '), '30/01/2022');
  assert.equal(dates.normalizeDateKey(''), '');
  assert.equal(dates.normalizeDateKey('2022-02-31'), '31/02/2022');
});

test('CURRENT BEHAVIOUR: a numeric settlement reduces the balance', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(result.settlement.id, 501);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.nextSettlementId, 502);
});

test('a string settlement reduces the balance by the numeric payment', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: zero and negative settlements are rejected without changes', () => {
  for (const amount of [0, -500]) {
    const db = makeLedgerDb();
    assert.deepEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, makeLedgerDb());
  }
});

test('nonnumeric and nonfinite settlements are rejected without changes', () => {
  for (const amount of ['invalid', 'Infinity', Infinity, NaN]) {
    const db = makeLedgerDb();
    assert.deepEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, makeLedgerDb());
  }
});
