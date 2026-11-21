var test = require('node:test');
var assert = require('node:assert/strict');

var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

function makeOrderDb() {
  return {
    orders: [
      { id: 1001, date: '28/12/2021' },
      { id: 1004, date: '30/01/2022' },
      { id: 1007, date: '04/03/2022' },
      { id: 1008, date: '15/03/2022' }
    ]
  };
}

function ids(result) {
  return result.map(function (order) { return order.id; });
}

function makeKhataDb(totalSettled) {
  return {
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: totalSettled
    }],
    nextSettlementId: 501,
    settlements: []
  };
}

test('order history sorts newest first chronologically', function () {
  assert.deepEqual(ids(orders.list(makeOrderDb())), [1008, 1007, 1004, 1001]);
});

test('January through March 2022 filtering is inclusive and excludes December 2021', function () {
  assert.deepEqual(ids(orders.list(makeOrderDb(), {
    from: '2022-01-01',
    to: '2022-03-31'
  })), [1008, 1007, 1004]);
});

test('January 1 and March 31 date boundaries are included', function () {
  var db = makeOrderDb();
  db.orders.push({ id: 1009, date: '01/01/2022' });
  db.orders.push({ id: 1010, date: '31/03/2022' });

  assert.deepEqual(ids(orders.list(db, {
    from: '2022-01-01',
    to: '2022-03-31'
  })), [1010, 1008, 1007, 1004, 1009]);
});

test('cross-year date filtering includes December 1 through January 31 boundaries', function () {
  assert.deepEqual(ids(orders.list(makeOrderDb(), {
    from: '01/12/2021',
    to: '31/01/2022'
  })), [1004, 1001]);
});

test('string settlement amount updates numeric totals and balance', function () {
  var db = makeKhataDb(1200);
  var result = ledger.recordSettlement(db, 7, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(typeof db.customers[0].totalSettled, 'number');
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('non-numeric settlement amount is rejected without mutations', function () {
  var db = makeKhataDb(1200);
  var before = {
    totalSettled: db.customers[0].totalSettled,
    balance: db.customers[0].balance,
    settlements: db.settlements.length
  };

  var result = ledger.recordSettlement(db, 7, 'not-a-number');

  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, before.totalSettled);
  assert.equal(db.customers[0].balance, before.balance);
  assert.equal(db.settlements.length, before.settlements);
});

test('NaN and infinite settlement amounts are rejected without mutations', function () {
  [NaN, Infinity, -Infinity, 'Infinity'].forEach(function (amount) {
    var db = makeKhataDb(1200);
    var result = ledger.recordSettlement(db, 7, amount);

    assert.equal(result.ok, false);
    assert.equal(db.customers[0].totalSettled, 1200);
    assert.equal(db.customers[0].balance, undefined);
    assert.equal(db.settlements.length, 0);
  });
});

test('zero settlement amount is rejected without mutations', function () {
  var db = makeKhataDb(1200);
  var result = ledger.recordSettlement(db, 7, 0);

  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, undefined);
  assert.equal(db.settlements.length, 0);
});

test('negative settlement amount is rejected without mutations', function () {
  var db = makeKhataDb(1200);
  var result = ledger.recordSettlement(db, 7, -25);

  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, undefined);
  assert.equal(db.settlements.length, 0);
});

test('numeric settlement input continues to update totals and balance', function () {
  var db = makeKhataDb(1200);
  var result = ledger.recordSettlement(db, 7, 500);

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(typeof db.customers[0].totalSettled, 'number');
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});
