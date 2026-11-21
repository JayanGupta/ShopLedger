const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderDates(filters) {
  const db = {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' }
    ]
  };
  return orders.list(db, filters).map(order => order.date);
}

function customerLedger() {
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

test('date range returns newest orders and a JSON settlement updates Meera’s balance', () => {
  const db = customerLedger();
  const result = ledger.recordSettlement(db, 1, JSON.parse('{"amount":"500"}').amount);

  assert.deepEqual({
    dates: orderDates({ from: '2022-01-30', to: '2022-03-15' }),
    ok: result.ok,
    totalSettled: result.customer.totalSettled,
    balance: result.customer.balance
  }, {
    dates: ['15/03/2022', '30/01/2022'],
    ok: true,
    totalSettled: 1700,
    balance: 732.01
  });
});

test('order history sorts newest first across months and years', () => {
  assert.deepEqual(orderDates(), ['15/03/2022', '30/01/2022', '28/12/2021']);
});

test('order history includes orders on and after the from date', () => {
  assert.deepEqual(orderDates({ from: '2022-01-30' }), ['15/03/2022', '30/01/2022']);
});

test('order history includes orders on and before the to date', () => {
  assert.deepEqual(orderDates({ to: '2022-03-15' }), ['15/03/2022', '30/01/2022', '28/12/2021']);
  assert.deepEqual(orderDates({ to: '10000-12-31' }), ['15/03/2022', '30/01/2022', '28/12/2021']);

  const datedOrder = { id: 1, date: '05/03/2022' };
  const db = { orders: [datedOrder, { id: 2, date: 'TBD' }] };
  assert.deepEqual(orders.list(db, { to: '2022-03-15' }), [datedOrder]);
});

test('order history includes both boundaries of the January-to-March range', () => {
  assert.deepEqual(orderDates({ from: '2022-01-30', to: '2022-03-15' }), ['15/03/2022', '30/01/2022']);
});

test('CURRENT BEHAVIOUR: normalizeDateKey returns trimmed day-first text', () => {
  assert.equal(dates.normalizeDateKey(' 2022-03-15 '), '15/03/2022');
  assert.equal(dates.normalizeDateKey(' 30/01/2022 '), '30/01/2022');
  assert.equal(dates.normalizeDateKey(undefined), '');
});

test('CURRENT BEHAVIOUR: a numeric settlement adds to the settled total', () => {
  const db = customerLedger();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(db.nextSettlementId, 502);
});

test('a string settlement adds numerically to the settled total', () => {
  const db = customerLedger();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(db.nextSettlementId, 502);
});

test('CURRENT BEHAVIOUR: zero and negative settlements are rejected', () => {
  for (const amount of [0, -500]) {
    const db = customerLedger();

    assert.deepEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, customerLedger());
  }
});

test('non-numeric and non-finite settlements are rejected without ledger changes', () => {
  for (const amount of ['abc', 'Infinity', Infinity, true]) {
    const db = customerLedger();

    assert.deepEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false,
      error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, customerLedger());
  }
});
