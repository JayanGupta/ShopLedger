var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var dates = require('../lib/dates');
var ledger = require('../lib/ledger');

function orderDb() {
  return { orders: [
    { id: 1008, date: '15/03/2022' },
    { id: 1004, date: '30/01/2022' },
    { id: 1001, date: '28/12/2021' }
  ] };
}

function ids(list) {
  return list.map(function (order) { return order.id; });
}

function ledgerDb() {
  return {
    nextSettlementId: 501,
    settlements: [],
    customers: [{ id: 1, name: 'Test customer', openingBalance: 450,
      totalBilled: 1982.01, totalSettled: 1200, balance: 1232.01 }]
  };
}

test('CURRENT BEHAVIOUR: order history sorts real dates newest first', function () {
  var db = orderDb();
  assert.deepStrictEqual(ids(orders.list(db)), [1008, 1004, 1001]);
  assert.deepStrictEqual(ids(db.orders), [1008, 1004, 1001]);
});

test('CURRENT BEHAVIOUR: ISO from filter excludes dates before its boundary', function () {
  assert.deepStrictEqual(ids(orders.list(orderDb(), { from: '2022-02-01' })), [1008]);
});

test('CURRENT BEHAVIOUR: ISO to filter includes January and excludes March', function () {
  assert.deepStrictEqual(ids(orders.list(orderDb(), { to: '2022-02-28' })), [1004, 1001]);
});

test('CURRENT BEHAVIOUR: ISO range includes only dates within its boundaries', function () {
  assert.deepStrictEqual(ids(orders.list(orderDb(), {
    from: '2022-02-01', to: '2022-03-31'
  })), [1008]);
});

test('CURRENT BEHAVIOUR: normalizeDateKey returns sortable strings without date validation', function () {
  assert.strictEqual(dates.normalizeDateKey('2022-03-15'), '2022-03-15');
  assert.strictEqual(dates.normalizeDateKey(' 30/01/2022 '), '2022-01-30');
  assert.strictEqual(dates.normalizeDateKey('2022-02-31'), '2022-02-31');
  assert.strictEqual(dates.normalizeDateKey('nonsense'), 'nonsense');
  assert.strictEqual(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: numeric settlement 500 leaves balance 732.01', function () {
  var db = ledgerDb();
  var result = ledger.recordSettlement(db, 1, 500, 'upi', 'Test payment');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer, db.customers[0]);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
  assert.strictEqual(result.settlement.id, 501);
  assert.strictEqual(db.nextSettlementId, 502);
  assert.deepStrictEqual(db.settlements, [result.settlement]);
});

test('CURRENT BEHAVIOUR: string settlement 500 updates totals numerically', function () {
  var db = ledgerDb();
  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Test payment');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
  assert.deepStrictEqual(db.settlements, [result.settlement]);
  assert.strictEqual(db.nextSettlementId, 502);
});

[0, -500, NaN].forEach(function (amount) {
  test('CURRENT BEHAVIOUR: settlement ' + String(amount) + ' is rejected without mutation', function () {
    var db = ledgerDb();
    var before = ledgerDb();
    assert.deepStrictEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false, error: 'Settlement amount must be greater than zero'
    });
    assert.deepStrictEqual(db, before);
  });
});

test('CURRENT BEHAVIOUR: non-numeric string settlement is rejected without mutation', function () {
  var db = ledgerDb();
  assert.deepStrictEqual(ledger.recordSettlement(db, 1, 'abc', 'upi', 'Invalid input'), {
    ok: false, error: 'Settlement amount must be greater than zero'
  });
  assert.deepStrictEqual(db, ledgerDb());
});

test('real date ordering and ISO filters work and string payments remain numeric', function () {
  assert.deepStrictEqual(ids(orders.list(orderDb())), [1008, 1004, 1001]);
  assert.deepStrictEqual(ids(orders.list(orderDb(), { from: '2022-02-01' })), [1008]);
  assert.deepStrictEqual(ids(orders.list(orderDb(), { to: '2022-02-28' })), [1004, 1001]);
  assert.deepStrictEqual(ids(orders.list(orderDb(), { from: '2022-01-01', to: '2022-03-15' })), [1008, 1004]);
  var db = ledgerDb();
  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Test payment');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.strictEqual(dates.getFiscalYear('2022-04-01'), 'FY22-23');
  [0, -1, 'abc', Infinity, 'Infinity', '', null, true, [], {}].forEach(function (amount) {
    var untouched = ledgerDb();
    assert.strictEqual(ledger.recordSettlement(untouched, 1, amount).ok, false);
    assert.deepStrictEqual(untouched, ledgerDb());
  });
});
