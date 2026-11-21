var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var dates = require('../lib/dates');
var ledger = require('../lib/ledger');

// Fixtures are independent of persistent storage. Never import or call lib/store.
function orderDb() {
  return { orders: [
    { id: 1, date: '15/03/2022' },
    { id: 2, date: '30/01/2022' },
    { id: 3, date: '28/12/2021' }
  ] };
}

function listDates(db, filters) {
  return orders.list(db, filters).map(function (order) { return order.date; });
}

function ledgerDb() {
  return {
    customers: [{
      id: 1,
      name: 'Test customer',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    nextSettlementId: 501,
    settlements: []
  };
}

test('REGRESSION: chronological history and numeric, validated settlements', function () {
  assert.deepEqual(listDates(orderDb()), ['15/03/2022', '30/01/2022', '28/12/2021']);
  assert.deepEqual(listDates(orderDb(), { from: '2022-01-30', to: '2022-03-15' }),
    ['15/03/2022', '30/01/2022']);
  assert.deepEqual(listDates(orderDb(), { from: '30/01/2022', to: '15/03/2022' }),
    ['15/03/2022', '30/01/2022']);
  var sameDay = { orders: [{ id: 1, date: '15/03/2022' }, { id: 2, date: '15/03/2022' }] };
  assert.deepEqual(orders.list(sameDay).map(function (o) { return o.id; }), [1, 2]);
  [500, '500'].forEach(function (amount) {
    var result = ledger.recordSettlement(ledgerDb(), 1, amount);
    assert.equal(result.ok, true);
    assert.equal(result.customer.totalSettled, 1700);
    assert.equal(result.customer.balance, 732.01);
  });
  [0, -500, 'abc', '', ' ', null, undefined, NaN, Infinity, -Infinity, true, [], [500], {}].forEach(function (amount) {
    var db = ledgerDb();
    var before = JSON.parse(JSON.stringify(db));
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
    assert.deepEqual(db, before);
  });
});

test('default order is newest real date first', function () {
  var db = orderDb();
  var before = JSON.parse(JSON.stringify(db));
  assert.deepEqual(listDates(db), ['15/03/2022', '30/01/2022', '28/12/2021']);
  assert.deepEqual(db, before);
});

test('ISO from filter excludes older dates', function () {
  assert.deepEqual(listDates(orderDb(), { from: '2022-02-01' }),
    ['15/03/2022']);
});

test('ISO to filter excludes later March date', function () {
  assert.deepEqual(listDates(orderDb(), { to: '2022-01-30' }),
    ['30/01/2022', '28/12/2021']);
});

test('combined ISO bounds include March within the range', function () {
  assert.deepEqual(listDates(orderDb(), { from: '2022-01-29', to: '2022-03-31' }),
    ['15/03/2022', '30/01/2022']);
});

test('CURRENT BEHAVIOUR: normalizeDateKey converts ISO to day-first text', function () {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey('2022-01-30'), '30/01/2022');
  assert.equal(dates.normalizeDateKey('2021-12-28'), '28/12/2021');
});

test('CURRENT BEHAVIOUR: normalizeDateKey trims and preserves day-first text', function () {
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '15/03/2022');
  assert.equal(dates.normalizeDateKey('5/3/2022'), '5/3/2022');
  assert.equal(dates.normalizeDateKey(''), '');
  assert.equal(dates.normalizeDateKey(null), '');
  assert.equal(dates.normalizeDateKey(undefined), '');
});

test('CURRENT BEHAVIOUR: normalizeDateKey does not validate dates', function () {
  assert.equal(dates.normalizeDateKey('2022-02-31'), '31/02/2022');
  assert.equal(dates.normalizeDateKey('not-a-date'), 'date/a/not');
  assert.equal(dates.normalizeDateKey('invalid'), 'invalid');
});

test('CURRENT BEHAVIOUR: numeric settlement adds 500 and leaves balance 732.01', function () {
  var db = ledgerDb();
  var result = ledger.recordSettlement(db, 1, 500, 'cash', 'Test payment');
  assert.equal(result.ok, true);
  assert.equal(result.customer, db.customers[0]);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(db.nextSettlementId, 502);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.deepEqual(result.settlement, {
    id: 501, customerId: 1, customerName: 'Test customer',
    date: result.settlement.date, amount: 500, mode: 'cash', note: 'Test payment'
  });
  assert.match(result.settlement.date, /^\d{2}\/\d{2}\/\d{4}$/);
});

test('string settlement adds numerically to totalSettled', function () {
  var db = ledgerDb();
  var result = ledger.recordSettlement(db, '1', '500');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(result.settlement.mode, 'upi');
  assert.equal(result.settlement.note, 'Khata settlement');
  assert.equal(db.settlements[0], result.settlement);
  assert.equal(db.nextSettlementId, 502);
});

test('CURRENT BEHAVIOUR: zero settlement is rejected without mutation', function () {
  var db = ledgerDb();
  var before = JSON.parse(JSON.stringify(db));
  assert.deepEqual(ledger.recordSettlement(db, 1, 0), {
    ok: false, error: 'Settlement amount must be greater than zero'
  });
  assert.deepEqual(db, before);
});

test('CURRENT BEHAVIOUR: negative settlement is rejected without mutation', function () {
  var db = ledgerDb();
  var before = JSON.parse(JSON.stringify(db));
  assert.deepEqual(ledger.recordSettlement(db, 1, -500), {
    ok: false, error: 'Settlement amount must be greater than zero'
  });
  assert.deepEqual(db, before);
});

test('non-numeric string settlement is rejected without mutation', function () {
  var db = ledgerDb();
  var before = JSON.parse(JSON.stringify(db));
  var result = ledger.recordSettlement(db, 1, 'abc');
  assert.deepEqual(result, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.deepEqual(db, before);
});
