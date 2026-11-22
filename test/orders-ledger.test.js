const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderFixture() {
  return {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' }
    ]
  };
}

const listingCases = [
  { name: 'default sort is descending day-first text', filters: undefined },
  { name: 'ISO from February includes January and December', filters: { from: '2022-02-01' } },
  { name: 'ISO to January includes March', filters: { to: '2022-01-31' } },
  { name: 'ISO January range includes all three months', filters: { from: '2022-01-01', to: '2022-01-31' } }
];

for (const example of listingCases) {
  test('CURRENT BEHAVIOUR: ' + example.name, () => {
    const db = orderFixture();
    const before = structuredClone(db);
    const result = orders.list(db, example.filters);

    assert.deepStrictEqual(result.map(order => order.id), [2, 3, 1]);
    assert.deepStrictEqual(result.map(order => order.date), [
      '30/01/2022', '28/12/2021', '15/03/2022'
    ]);
    assert.notStrictEqual(result, db.orders);
    assert.deepStrictEqual(db, before);
  });
}

test('CURRENT BEHAVIOUR: normalizeDateKey returns day-first text', () => {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey(' 2022-01-30 '), '30/01/2022');
  assert.equal(dates.normalizeDateKey(' 28/12/2021 '), '28/12/2021');
  assert.equal(dates.normalizeDateKey(''), '');
  assert.equal(dates.normalizeDateKey(undefined), '');
});

test('CURRENT BEHAVIOUR: normalizeDateKey accepts invalid and unpadded dates', () => {
  assert.equal(dates.normalizeDateKey('2022-02-31'), '31/02/2022');
  assert.equal(dates.normalizeDateKey('2022-3-5'), '5/3/2022');
  assert.equal(dates.normalizeDateKey('not-a-date'), 'date/a/not');
});

function ledgerFixture() {
  return {
    customers: [{
      id: 1,
      name: 'Test customer',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    nextSettlementId: 501,
    settlements: [{ id: 500 }]
  };
}

const acceptedAmounts = [
  {
    name: 'numeric 500 settles to 1700 and balance 732.01',
    input: 500, settled: 1700, balance: 732.01, entryAmount: 500
  },
  {
    name: 'string 500 concatenates to 1200500 and corrupts balance',
    input: '500', settled: '1200500', balance: -1198067.99, entryAmount: 500
  },
  {
    name: 'nonnumeric string succeeds with NaN balance and entry amount',
    input: 'oops', settled: '1200oops', balance: NaN, entryAmount: NaN
  }
];

for (const example of acceptedAmounts) {
  test('CURRENT BEHAVIOUR: ' + example.name, t => {
    // Fix the date in memory so assertions do not depend on the system clock.
    t.mock.method(dates, 'today', () => '15/03/2022');
    const db = ledgerFixture();
    const result = ledger.recordSettlement(db, '1', example.input, 'cash', 'Test payment');
    const expectedCustomer = {
      id: 1,
      name: 'Test customer',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: example.settled,
      balance: example.balance
    };
    const expectedEntry = {
      id: 501,
      customerId: 1,
      customerName: 'Test customer',
      date: '15/03/2022',
      amount: example.entryAmount,
      mode: 'cash',
      note: 'Test payment'
    };

    assert.deepStrictEqual(result, {
      ok: true, customer: expectedCustomer, settlement: expectedEntry
    });
    assert.strictEqual(result.customer, db.customers[0]);
    assert.strictEqual(result.settlement, db.settlements[0]);
    assert.deepStrictEqual(db.customers, [expectedCustomer]);
    assert.deepStrictEqual(db.settlements, [expectedEntry, { id: 500 }]);
    assert.equal(db.nextSettlementId, 502);
  });
}

for (const amount of [0, -500]) {
  test('CURRENT BEHAVIOUR: amount ' + amount + ' is rejected without mutation', () => {
    const db = ledgerFixture();
    const before = structuredClone(db);

    assert.deepStrictEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepStrictEqual(db, before);
  });
}
