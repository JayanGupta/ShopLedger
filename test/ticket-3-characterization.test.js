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

test('order history sorts DD/MM/YYYY dates newest first chronologically', function () {
  var db = makeOrderDb();

  assert.deepEqual(ids(orders.list(db)), [1008, 1007, 1004, 1001]);
});

test('date range filtering uses inclusive chronological boundaries', function () {
  var db = makeOrderDb();

  assert.deepEqual(ids(orders.list(db, {
    from: '01/01/2022',
    to: '31/03/2022'
  })), [1008, 1007, 1004]);
});

test('ISO date bounds filter chronologically', function () {
  var db = makeOrderDb();

  assert.deepEqual(ids(orders.list(db, {
    from: '2022-01-01',
    to: '2022-03-31'
  })), [1008, 1007, 1004]);
});

test('date boundaries spanning months and years are chronological', function () {
  var db = makeOrderDb();

  assert.deepEqual(ids(orders.list(db, {
    from: '28/12/2021',
    to: '30/01/2022'
  })), [1004, 1001]);

  assert.deepEqual(ids(orders.list(db, {
    from: '2021-12-28',
    to: '2022-01-30'
  })), [1004, 1001]);
});

test('string settlement amount is converted before updating customer balance', function () {
  var db = {
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200
    }],
    nextSettlementId: 501,
    settlements: []
  };

  var result = ledger.recordSettlement(db, 7, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(typeof db.customers[0].totalSettled, 'number');
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
});
