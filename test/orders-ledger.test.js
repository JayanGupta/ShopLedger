const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

const orderHistory = {
  orders: [
    { id: 1, date: '15/03/2022' },
    { id: 2, date: '30/01/2022' },
    { id: 3, date: '28/12/2021' }
  ]
};

function createLedger() {
  return {
    customers: [{
      id: 1,
      name: 'Test Customer',
      openingBalance: 300,
      totalBilled: 2132.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('CURRENT BEHAVIOUR: order history sorts mixed dates newest first', () => {
  assert.deepEqual(orders.list(orderHistory).map(order => order.date), [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('CURRENT BEHAVIOUR: ISO date filters include orders within calendar bounds', () => {
  assert.deepEqual(
    orders.list(orderHistory, { from: '2022-02-01' }).map(order => order.id),
    [1]
  );
  assert.deepEqual(
    orders.list(orderHistory, { to: '2022-02-28' }).map(order => order.id),
    [2, 3]
  );
  assert.deepEqual(
    orders.list(orderHistory, {
      from: '2021-12-28',
      to: '2022-03-15'
    }).map(order => order.id),
    [1, 2, 3]
  );
});

test('CURRENT BEHAVIOUR: normalizeDateKey returns trimmed year-first keys', () => {
  assert.equal(dates.normalizeDateKey(' 2022-03-15 '), '2022-03-15');
  assert.equal(dates.normalizeDateKey(' 30/01/2022 '), '2022-01-30');
  assert.equal(dates.normalizeDateKey(''), '');
  assert.equal(dates.normalizeDateKey(undefined), '');
});

test('CURRENT BEHAVIOUR: normalizeDateKey rejects impossible dates', () => {
  assert.equal(dates.normalizeDateKey('2022-02-31'), '');
});

test('CURRENT BEHAVIOUR: numeric settlement subtracts 500 from the balance', () => {
  const db = createLedger();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(db.nextSettlementId, 502);
});

test('CURRENT BEHAVIOUR: string settlement is added as a number', () => {
  const db = createLedger();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
});

test('CURRENT BEHAVIOUR: zero and negative settlements leave the ledger unchanged', () => {
  const db = createLedger();
  const rejected = { ok: false, error: 'Settlement amount must be greater than zero' };

  assert.deepEqual(ledger.recordSettlement(db, 1, 0), rejected);
  assert.deepEqual(db, createLedger());
  assert.deepEqual(ledger.recordSettlement(db, 1, -500), rejected);
  assert.deepEqual(db, createLedger());
});

test('CURRENT BEHAVIOUR: non-numeric settlement leaves the ledger unchanged', () => {
  const db = createLedger();
  const result = ledger.recordSettlement(db, 1, 'abc');

  assert.deepEqual(result, {
    ok: false,
    error: 'Settlement amount must be greater than zero'
  });
  assert.deepEqual(db, createLedger());
});

test('order history uses calendar dates and Khata accepts only valid numeric amounts', () => {
  const db = createLedger();
  const settled = ledger.recordSettlement(db, 1, '500');
  const invalid = createLedger();
  const badPayment = ledger.recordSettlement(invalid, 1, 'abc');

  assert.deepEqual({
    newestFirst: orders.list(orderHistory).map(order => order.id),
    dateRange: orders.list(orderHistory, {
      from: '2021-12-28',
      to: '2022-03-15'
    }).map(order => order.id),
    settled: settled.ok,
    settledAmount: settled.settlement?.amount,
    totalSettled: db.customers[0].totalSettled,
    balance: db.customers[0].balance,
    acceptedInvalidAmount: badPayment.ok
  }, {
    newestFirst: [1, 2, 3],
    dateRange: [1, 2, 3],
    settled: true,
    settledAmount: 500,
    totalSettled: 1700,
    balance: 732.01,
    acceptedInvalidAmount: false
  });
  assert.deepEqual(invalid, createLedger());
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});
