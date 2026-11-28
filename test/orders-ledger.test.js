'use strict';

const test = require('node:test');
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
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 505
  };
}

test('orders.list sorts DD/MM/YYYY dates chronologically, newest first', () => {
  const list = orders.list(orderDb());
  assert.deepEqual(list.map((order) => order.date), [
    '15/03/2022', '30/01/2022', '28/12/2021'
  ]);
});

test('orders.list applies ISO from/to bounds to DD/MM/YYYY dates', () => {
  const list = orders.list(orderDb(), {
    from: '2022-02-01',
    to: '2022-02-28'
  });
  assert.deepEqual(list.map((order) => order.date), []);
});

test('CURRENT BEHAVIOUR: normalizeDateKey changes ISO input to DD/MM/YYYY', () => {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey('30/01/2022'), '30/01/2022');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: numeric settlement amount reduces Meera balance correctly', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'cash', 'numeric amount');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
});

test('string settlement amount is converted before updating the balance', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'cash', 'JSON string amount');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: zero and negative settlement amounts are rejected', () => {
  for (const amount of [0, -1]) {
    const db = ledgerDb();
    const result = ledger.recordSettlement(db, 1, amount, 'cash', 'invalid amount');

    assert.equal(result.ok, false);
    assert.equal(result.error, 'Settlement amount must be greater than zero');
    assert.equal(db.customers[0].totalSettled, 1200);
    assert.equal(db.customers[0].balance, 1232.01);
    assert.equal(db.settlements.length, 0);
  }
});

test('non-numeric settlement amount is rejected without changing totals', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 'not-a-number', 'cash', 'invalid amount');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('orders use real dates and settlements validate numeric amounts', () => {
  const db = {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' },
      { id: 4, date: '01/02/2022' },
      { id: 5, date: '28/02/2022' },
      { id: 6, date: '01/03/2022' }
    ]
  };
  assert.deepEqual(orders.list(db).map((order) => order.id), [1, 6, 5, 4, 2, 3]);
  assert.deepEqual(
    orders.list(db, { from: '2022-02-01', to: '2022-02-28' }).map((order) => order.id),
    [5, 4]
  );

  const customerDb = ledgerDb();
  const result = ledger.recordSettlement(customerDb, 1, '500', 'cash', 'string amount');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(typeof result.settlement.amount, 'number');

  for (const amount of [0, -1, 'not-a-number', true]) {
    const invalid = ledger.recordSettlement(customerDb, 1, amount, 'cash', 'invalid amount');
    assert.equal(invalid.ok, false);
    assert.equal(customerDb.customers[0].totalSettled, 1700);
    assert.equal(customerDb.customers[0].balance, 732.01);
  }
});
