const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function makeOrdersDb() {
  return {
    orders: [
      { id: 1001, date: '28/12/2021', customer: 'Walk-in' },
      { id: 1004, date: '30/01/2022', customer: 'Rahul' },
      { id: 1007, date: '04/03/2022', customer: 'Amit' },
      { id: 1008, date: '15/03/2022', customer: 'Meera' }
    ]
  };
}

function makeLedgerDb() {
  return {
    nextSettlementId: 501,
    settlements: [],
    customers: [
      {
        id: 1,
        name: 'Meera Joshi',
        openingBalance: 450,
        totalBilled: 1982.01,
        totalSettled: 1200,
        balance: 1232.01
      }
    ]
  };
}

test('orders.list sorts orders newest first by calendar date', () => {
  const db = makeOrdersDb();
  const result = orders.list(db);

  assert.deepEqual(
    result.map((o) => o.id),
    [1008, 1007, 1004, 1001]
  );
  assert.deepEqual(
    result.map((o) => o.date),
    ['15/03/2022', '04/03/2022', '30/01/2022', '28/12/2021']
  );
});

test('orders.list filters by "from" date correctly using HTML5 ISO date format', () => {
  const db = makeOrdersDb();
  const result = orders.list(db, { from: '2022-01-30' });

  assert.deepEqual(
    result.map((o) => o.id),
    [1008, 1007, 1004]
  );
});

test('orders.list filters by "to" date correctly using HTML5 ISO date format', () => {
  const db = makeOrdersDb();
  const result = orders.list(db, { to: '2022-01-31' });

  assert.deepEqual(
    result.map((o) => o.id),
    [1004, 1001]
  );
});

test('orders.list filters by both "from" and "to" date range', () => {
  const db = makeOrdersDb();
  const result = orders.list(db, { from: '2022-01-01', to: '2022-01-31' });

  assert.deepEqual(
    result.map((o) => o.id),
    [1004]
  );
});

test('dates.dateToSortKey correctly calculates numeric sortable values', () => {
  assert.equal(dates.dateToSortKey('15/03/2022'), 20220315);
  assert.equal(dates.dateToSortKey('2022-03-15'), 20220315);
  assert.equal(dates.dateToSortKey('30/01/2022'), 20220130);
  assert.equal(dates.dateToSortKey('28/12/2021'), 20211228);
  assert.equal(dates.dateToSortKey(''), 0);
});

test('ledger.recordSettlement correctly handles string settlement amount without string concatenation', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'March payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements.length, 1);
  assert.equal(db.settlements[0].amount, 500);
});

test('ledger.recordSettlement correctly handles numeric settlement amount', () => {
  const db = makeLedgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'cash', 'Cash counter');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
});

test('ledger.recordSettlement rejects zero and negative amounts', () => {
  const db = makeLedgerDb();

  const zeroRes = ledger.recordSettlement(db, 1, 0);
  assert.equal(zeroRes.ok, false);
  assert.equal(zeroRes.error, 'Settlement amount must be greater than zero');

  const negRes = ledger.recordSettlement(db, 1, -200);
  assert.equal(negRes.ok, false);
  assert.equal(negRes.error, 'Settlement amount must be greater than zero');

  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
});

test('ledger.recordSettlement rejects non-numeric or boolean amounts without corrupting ledger', () => {
  const db = makeLedgerDb();

  const strRes = ledger.recordSettlement(db, 1, 'invalid');
  assert.equal(strRes.ok, false);
  assert.equal(strRes.error, 'Settlement amount must be greater than zero');

  const boolRes = ledger.recordSettlement(db, 1, true);
  assert.equal(boolRes.ok, false);
  assert.equal(boolRes.error, 'Settlement amount must be greater than zero');

  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});
