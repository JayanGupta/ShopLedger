const { test } = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function makeOrdersDb() {
  return {
    orders: [
      { id: 1, date: '28/12/2021' },
      { id: 2, date: '15/03/2022' },
      { id: 3, date: '30/01/2022' }
    ]
  };
}

function makeLedgerDb() {
  return {
    nextSettlementId: 501,
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

test('CORRECT BEHAVIOUR: orders.list sorts dates newest first by calendar date', () => {
  const result = orders.list(makeOrdersDb());

  assert.deepEqual(result.map((order) => order.date), [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('CORRECT BEHAVIOUR: orders.list from filter includes calendar dates on and after picker date', () => {
  const result = orders.list(makeOrdersDb(), { from: '2022-01-30' });

  assert.deepEqual(result.map((order) => order.date), ['15/03/2022', '30/01/2022']);
});

test('CORRECT BEHAVIOUR: orders.list to filter includes calendar dates on and before picker date', () => {
  const result = orders.list(makeOrdersDb(), { to: '2022-01-30' });

  assert.deepEqual(result.map((order) => order.date), [
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey converts ISO dates and trims existing dates', () => {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '15/03/2022');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: numeric settlement amount updates totals arithmetically', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'upi', 'cash-up');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements.length, 1);
});

test('CORRECT BEHAVIOUR: string settlement amount is converted before updating totals', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'json-body');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: zero settlement is rejected without recording an entry', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, 0);

  assert.deepEqual(result, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: negative settlement is rejected without recording an entry', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, -1);

  assert.deepEqual(result, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
});

test('CORRECT BEHAVIOUR: non-numeric settlement is rejected without changing ledger data', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, 'not-a-number');

  assert.deepEqual(result, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);

  const booleanDb = makeLedgerDb();
  const booleanResult = ledger.recordSettlement(booleanDb, 1, true);
  assert.equal(booleanResult.ok, false);
  assert.equal(booleanDb.customers[0].totalSettled, 1200);
  assert.equal(booleanDb.settlements.length, 0);
});

test('CORRECT BEHAVIOUR: order dates are chronological and settlements use validated numbers', () => {
  const db = makeOrdersDb();

  assert.deepEqual(orders.list(db).map((order) => order.id), [2, 3, 1]);
  assert.deepEqual(orders.list(db, { from: '2022-01-30' }).map((order) => order.id), [2, 3]);
  assert.deepEqual(orders.list(db, { to: '2022-01-30' }).map((order) => order.id), [3, 1]);

  const settlementDb = makeLedgerDb();
  const settled = ledger.recordSettlement(settlementDb, 1, '500', 'upi', 'json-body');
  assert.equal(settled.ok, true);
  assert.equal(settled.customer.totalSettled, 1700);
  assert.equal(settled.customer.balance, 732.01);

  const invalidDb = makeLedgerDb();
  const invalid = ledger.recordSettlement(invalidDb, 1, 'not-a-number');
  assert.equal(invalid.ok, false);
  assert.equal(invalidDb.customers[0].totalSettled, 1200);
  assert.equal(invalidDb.customers[0].balance, 1232.01);
  assert.equal(invalidDb.settlements.length, 0);
});
