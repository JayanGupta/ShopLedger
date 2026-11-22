var test = require('node:test');
var assert = require('node:assert/strict');
var dates = require('../lib/dates');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');
var seed = require('../data/db.json');

function copyDb() { return JSON.parse(JSON.stringify(seed)); }
function ids(list) { return list.map(function (o) { return o.id; }); }

test('order history is newest first across months and years without mutating storage', function () {
  var db = copyDb();
  assert.deepEqual(ids(orders.list(db)), [1008, 1007, 1006, 1005, 1004, 1003, 1002, 1001]);
  assert.equal(db.orders[0].id, 1001);
});

test('same-day orders use descending IDs even with mixed date formats', function () {
  var db = { orders: [{ id: 1, date: '05/01/2022' }, { id: 2, date: '2022-01-05' }] };
  assert.deepEqual(ids(orders.list(db)), [2, 1]);
});

test('date filters accept ISO and display dates with inclusive endpoints', function () {
  assert.deepEqual(ids(orders.list(seed, { from: '2022-01-01', to: '2022-01-31' })), [1004, 1003, 1002]);
  assert.deepEqual(ids(orders.list(seed, { from: '28/12/2021', to: '05/01/2022' })), [1002, 1001]);
  assert.deepEqual(ids(orders.list(seed, { from: '2022-03-04' })), [1008, 1007]);
  assert.deepEqual(ids(orders.list(seed, { to: '2021-12-28' })), [1001]);
});

test('date normalization preserves fiscal-year boundaries for both input formats', function () {
  assert.equal(dates.normalizeDateKey('05/01/2022'), '2022-01-05');
  assert.equal(dates.normalizeDateKey('2022-01-05'), '2022-01-05');
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});

test('a string settlement of 500 reduces Meera balance to 732.01', function () {
  var db = copyDb();
  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Part payment');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.nextSettlementId, 506);
});

test('settlements normalize existing numeric strings and round money consistently', function () {
  var db = copyDb();
  db.customers[0].totalSettled = '1200';
  db.customers[0].openingBalance = '450';
  db.customers[0].totalBilled = '1982.01';
  var result = ledger.recordSettlement(db, 1, '0.105');
  assert.equal(result.settlement.amount, 0.11);
  assert.equal(result.customer.totalSettled, 1200.11);
  assert.equal(result.customer.balance, 1231.9);
});

test('invalid settlement amounts never mutate customer balances or settlement IDs', function () {
  ['', ' ', 'abc', 'Infinity', Infinity, NaN, 0, -1, null, true, [], {}, '0.001'].forEach(function (amount) {
    var db = copyDb();
    var before = JSON.stringify(db);
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false, String(amount));
    assert.equal(JSON.stringify(db), before);
  });
});
