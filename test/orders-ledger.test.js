'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const dates = require('../lib/dates');
const ledger = require('../lib/ledger');
const orders = require('../lib/orders');

function orderDb() {
  return {
    orders: [
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' },
      { id: 1004, date: '30/01/2022' }
    ]
  };
}

function ledgerDb() {
  return {
    nextSettlementId: 501,
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: []
  };
}

test('CURRENT BEHAVIOUR: normalizeDateKey converts valid picker dates and rejects invalid dates', function () {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey('15/03/2022'), '15/03/2022');
  assert.equal(dates.normalizeDateKey('2022-13-40'), '');
});

test('CURRENT BEHAVIOUR: orders.list sorts mixed DD/MM/YYYY dates newest first', function () {
  const result = orders.list(orderDb());
  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('CURRENT BEHAVIOUR: orders.list treats an ISO from date as an inclusive lower bound', function () {
  const result = orders.list(orderDb(), { from: '2022-01-30' });
  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004]);
});

test('CURRENT BEHAVIOUR: orders.list treats an ISO to date as an inclusive upper bound', function () {
  const result = orders.list(orderDb(), { to: '2022-01-30' });
  assert.deepEqual(result.map(function (order) { return order.id; }), [1004, 1001]);
});

test('CURRENT BEHAVIOUR: orders.list applies ISO from and to dates together', function () {
  const result = orders.list(orderDb(), { from: '2022-01-30', to: '2022-01-30' });
  assert.deepEqual(result.map(function (order) { return order.id; }), [1004]);
});

test('CURRENT BEHAVIOUR: recordSettlement adds a numeric amount and recalculates the balance', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'cash', 'counter');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
});

test('CURRENT BEHAVIOUR: recordSettlement converts a numeric string before adding it', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'JSON body amount');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
});

test('CURRENT BEHAVIOUR: recordSettlement rejects zero, negative, and non-numeric amounts without mutation', function () {
  [0, -500, 'not-a-number'].forEach(function (amount) {
    const db = ledgerDb();
    const before = {
      totalSettled: db.customers[0].totalSettled,
      balance: db.customers[0].balance,
      nextSettlementId: db.nextSettlementId,
      settlements: db.settlements.slice()
    };

    const result = ledger.recordSettlement(db, 1, amount);

    assert.equal(result.ok, false);
    assert.equal(result.error, 'Settlement amount must be greater than zero');
    assert.equal(db.customers[0].totalSettled, before.totalSettled);
    assert.equal(db.customers[0].balance, before.balance);
    assert.equal(db.nextSettlementId, before.nextSettlementId);
    assert.deepEqual(db.settlements, before.settlements);
  });
});

test('CURRENT BEHAVIOUR: ticket regression returns chronological orders and the correct settlement balance', function () {
  const db = ledgerDb();
  const settlement = ledger.recordSettlement(db, 1, '500', 'upi', 'JSON body amount');

  assert.deepEqual({
    newestFirstIds: orders.list(orderDb()).map(function (order) { return order.id; }),
    totalSettled: settlement.customer.totalSettled,
    balance: settlement.customer.balance
  }, {
    newestFirstIds: [1008, 1004, 1001],
    totalSettled: 1700,
    balance: 732.01
  });
});
