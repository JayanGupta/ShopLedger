const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function makeOrderDb() {
  return {
    orders: [
      { id: 103, date: '15/03/2022' },
      { id: 101, date: '28/12/2021' },
      { id: 102, date: '30/01/2022' }
    ]
  };
}

function makeLedgerDb() {
  return {
    customers: [{
      id: 1,
      name: 'Test Customer',
      openingBalance: 200,
      totalBilled: 2232.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('orders.list sorts dates newest first across months and years', () => {
  const db = makeOrderDb();
  db.orders.push({ id: 104, date: '15/03/2022' });

  assert.deepEqual(orders.list(db).map(order => order.id), [104, 103, 102, 101]);
});

test('orders.list from filter includes orders on or after the start date', () => {
  const result = orders.list(makeOrderDb(), { from: '2022-01-30' });

  assert.deepEqual(result.map(order => order.date), ['15/03/2022', '30/01/2022']);
});

test('orders.list to filter includes orders on or before the end date', () => {
  const result = orders.list(makeOrderDb(), { to: '2022-01-30' });

  assert.deepEqual(result.map(order => order.date), [
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('orders.list includes both endpoints of the December to March range', () => {
  const result = orders.list(makeOrderDb(), { from: '2021-12-28', to: '2022-03-15' });

  assert.deepEqual(result.map(order => order.date), [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('normalizeDateKey returns sortable YYYY-MM-DD keys', () => {
  assert.equal(dates.normalizeDateKey(' 2022-03-15 '), '2022-03-15');
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '2022-03-15');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: recordSettlement adds a numeric amount to totalSettled', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(result.settlement.id, 501);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(db.nextSettlementId, 502);
});

test('recordSettlement adds a numeric string as a number', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
});

for (const [label, amount] of [['zero', 0], ['a negative amount', -500]]) {
  test(`CURRENT BEHAVIOUR: recordSettlement rejects ${label} without changing the ledger`, () => {
    const db = makeLedgerDb();
    const result = ledger.recordSettlement(db, 1, amount);

    assert.deepEqual(result, {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, makeLedgerDb());
  });
}

test('recordSettlement rejects invalid amounts and balance overflow without changing the ledger', () => {
  for (const amount of ['abc', '', true, [500], {}, NaN, Infinity, 'Infinity']) {
    const db = makeLedgerDb();
    const result = ledger.recordSettlement(db, 1, amount);

    assert.deepEqual(result, {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, makeLedgerDb());
  }

  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, '1e308');

  assert.deepEqual(result, {
    ok: false,
    error: 'Settlement exceeds the supported balance range'
  });
  assert.deepEqual(db, makeLedgerDb());
});

test('REGRESSION: order history uses real dates and Khata settlements keep a numeric balance', () => {
  const dateRange = { from: '2022-01-01', to: '2022-03-15' };
  const history = orders.list(makeOrderDb()).map(order => order.date);
  const filtered = orders.list(makeOrderDb(), dateRange).map(order => order.date);
  const db = makeLedgerDb();
  const payment = ledger.recordSettlement(db, 1, '500');
  const balance = db.customers[0].balance;
  const invalidPayment = ledger.recordSettlement(db, 1, 'abc');

  assert.deepEqual({
    history,
    filtered,
    accepted: payment.ok,
    balance,
    rejectedInvalid: !invalidPayment.ok,
    settlementCount: db.settlements.length
  }, {
    history: ['15/03/2022', '30/01/2022', '28/12/2021'],
    filtered: ['15/03/2022', '30/01/2022'],
    accepted: true,
    balance: 732.01,
    rejectedInvalid: true,
    settlementCount: 1
  });
});
