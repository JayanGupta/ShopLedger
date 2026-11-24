var test = require('node:test');
var assert = require('node:assert/strict');
var dates = require('../lib/dates');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

var orderDb = {
  orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1002, date: '01/01/2022' },
    { id: 1004, date: '31/01/2022' },
    { id: 1007, date: '04/03/2022' },
    { id: 1008, date: '15/03/2022' }
  ]
};

function ids(results) {
  return results.map(function (order) { return order.id; });
}

test('orders sort newest first across months and years', function () {
  assert.deepEqual(ids(orders.list(orderDb)), [1008, 1007, 1004, 1002, 1001]);
});

test('order date bounds include both endpoints and accept either date format', function () {
  assert.deepEqual(ids(orders.list(orderDb, { from: '2022-01-01', to: '31/01/2022' })), [1004, 1002]);
  assert.equal(dates.getFiscalYear('2022-01-01'), 'FY21-22');
  assert.equal(dates.getFiscalYear('01/04/2022'), 'FY22-23');
});

function settlementDb() {
  return {
    nextSettlementId: 1,
    settlements: [],
    customers: [{ id: 1, openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200 }]
  };
}

test('settling with a numeric string records a numeric payment and balance', function () {
  var db = settlementDb();
  var result = ledger.recordSettlement(db, 1, '500');
  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 500);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
});

test('invalid settlement amounts leave the ledger unchanged', function () {
  [0, -1, 'invalid', 'Infinity', true, [500]].forEach(function (amount) {
    var db = settlementDb();
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
    assert.deepEqual(db, settlementDb());
  });
});
