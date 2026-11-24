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

function customerDb() {
  return {
    customers: [{
      id: 1,
      name: 'Test Customer',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('CURRENT BEHAVIOUR: order history sorts by descending calendar date', () => {
  assert.deepEqual(orders.list(orderDb).map(order => order.id), [1, 2, 3]);
});

test('CURRENT BEHAVIOUR: ISO date bounds filter by calendar date', () => {
  const from = '2022-01-30';
  const to = '2022-03-15';

  assert.deepEqual(orders.list(orderDb, { from }).map(order => order.id), [1, 2]);
  assert.deepEqual(orders.list(orderDb, { to }).map(order => order.id), [1, 2, 3]);
  assert.deepEqual(orders.list(orderDb, { from, to }).map(order => order.id), [1, 2]);
});

test('CURRENT BEHAVIOUR: normalizeDateKey returns day-first text', () => {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey(' 28/12/2021 '), '28/12/2021');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: numeric settlement reduces the balance by 500', () => {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(db.nextSettlementId, 502);
});

test('CURRENT BEHAVIOUR: string settlement adds to the settled total numerically', () => {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
});

test('CURRENT BEHAVIOUR: zero and negative settlements are rejected', () => {
  for (const amount of [0, -500]) {
    const db = customerDb();

    assert.deepEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, customerDb());
  }
});

test('CURRENT BEHAVIOUR: non-numeric settlement is rejected without updates', () => {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 'abc');

  assert.equal(result.ok, false);
  assert.deepEqual(db, customerDb());
});

test('orders use calendar dates and Khata accepts only positive numeric amounts', async (t) => {
  await t.test('sorts newest first and includes both date bounds', () => {
    const db = { orders: [...orderDb.orders, { id: 4, date: '15/03/2022' }] };
    assert.deepEqual(orders.list(db).map(order => order.id), [4, 1, 2, 3]);
    assert.deepEqual(orders.list(db, {
      from: '2021-12-28',
      to: '15/03/2022'
    }).map(order => order.id), [4, 1, 2, 3]);
  });

  await t.test('subtracts a numeric string payment from the balance', () => {
    const db = customerDb();
    ledger.recordSettlement(db, 1, '500');
    assert.equal(db.customers[0].balance, 732.01);
  });

  await t.test('rejects invalid amounts without changing the ledger', () => {
    for (const amount of ['abc', Infinity, 'Infinity', Number.MAX_VALUE, true, [500], '   ']) {
      const db = customerDb();
      assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
      assert.deepEqual(db, customerDb());
    }
  });
});
