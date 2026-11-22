const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

const orderDb = {
  orders: [
    { id: 1, date: '15/03/2022' },
    { id: 2, date: '30/01/2022' },
    { id: 3, date: '28/12/2021' },
  ],
};

function listedDates(filters) {
  return orders.list(orderDb, filters).map((order) => order.date);
}

function makeLedgerDb() {
  return {
    customers: [{
      id: 1,
      name: 'Test Customer',
      openingBalance: 1000,
      totalBilled: 1432.01,
      totalSettled: 1200,
      balance: 1232.01,
    }],
    settlements: [],
    nextSettlementId: 1,
  };
}

test('order history uses calendar dates and Khata applies a numeric payment', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, '1', '500');

  assert.deepEqual({
    sorted: listedDates(),
    filtered: listedDates({ from: '2022-01-30', to: '15/03/2022' }),
    balance: result.customer.balance,
  }, {
    sorted: ['15/03/2022', '30/01/2022', '28/12/2021'],
    filtered: ['15/03/2022', '30/01/2022'],
    balance: 732.01,
  });
});

test('CURRENT BEHAVIOUR: default order sort is newest first across months and years', () => {
  assert.deepEqual(listedDates(), ['15/03/2022', '30/01/2022', '28/12/2021']);

  const db = { orders: [{ id: 1, date: '15/03/2022' }, { id: 2, date: '15/03/2022' }] };
  assert.deepEqual(orders.list(db).map((order) => order.id), [2, 1]);
});

test('CURRENT BEHAVIOUR: ISO from filter includes its boundary and later dates', () => {
  assert.deepEqual(listedDates({ from: '2022-01-30' }), ['15/03/2022', '30/01/2022']);
});

test('CURRENT BEHAVIOUR: ISO to filter includes its boundary and earlier dates', () => {
  assert.deepEqual(listedDates({ to: '2022-01-30' }), [
    '30/01/2022', '28/12/2021',
  ]);
});

test('CURRENT BEHAVIOUR: ISO date range includes both endpoints', () => {
  assert.deepEqual(listedDates({ from: '2022-01-30', to: '2022-03-15' }), [
    '15/03/2022', '30/01/2022',
  ]);
});

test('CURRENT BEHAVIOUR: normalizeDateKey returns trimmed day-first dates', () => {
  assert.equal(dates.normalizeDateKey(' 2022-03-15 '), '15/03/2022');
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '15/03/2022');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: normalizeDateKey accepts an impossible date', () => {
  assert.equal(dates.normalizeDateKey('2022-02-31'), '31/02/2022');
});

test('CURRENT BEHAVIOUR: numeric settlement adds to totalSettled and reduces balance', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, '1', 500);

  assert.equal(result.ok, true);
  assert.equal(result.customer, db.customers[0]);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(result.settlement.id, 1);
  assert.equal(db.nextSettlementId, 2);
});

test('CURRENT BEHAVIOUR: string settlement adds numerically and reduces balance', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, '1', '500');

  assert.equal(result.ok, true);
  assert.equal(result.customer, db.customers[0]);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
});

for (const [label, amount] of [['zero', 0], ['negative', -500]]) {
  test(`CURRENT BEHAVIOUR: ${label} settlement is rejected without mutation`, () => {
    const db = makeLedgerDb();
    const result = ledger.recordSettlement(db, '1', amount);

    assert.deepEqual(result, {
      ok: false,
      error: 'Settlement amount must be greater than zero',
    });
    assert.deepEqual(db, makeLedgerDb());
  });
}

test('CURRENT BEHAVIOUR: invalid settlement amounts are rejected without mutation', () => {
  for (const amount of ['abc', 'Infinity', Infinity, NaN, true, [500]]) {
    const db = makeLedgerDb();
    const result = ledger.recordSettlement(db, '1', amount);

    assert.deepEqual(result, {
      ok: false,
      error: 'Settlement amount must be greater than zero',
    });
    assert.deepEqual(db, makeLedgerDb());
  }
});
