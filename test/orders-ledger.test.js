var test = require('node:test');
var assert = require('node:assert/strict');
var dates = require('../lib/dates');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

test('normalizeDateKey makes DD/MM/YYYY and YYYY-MM-DD comparable', function () {
  assert.equal(dates.normalizeDateKey('15/03/2022'), '20220315');
  assert.equal(dates.normalizeDateKey('2022-03-15'), '20220315');
  assert.equal(dates.normalizeDateKey('31/02/2022'), '');
});

test('orders list newest first and applies date picker filters', function () {
  var db = {
    orders: [
      { id: 1001, date: '28/12/2021', customer: 'Meera' },
      { id: 1004, date: '30/01/2022', customer: 'Kalyani' },
      { id: 1008, date: '15/03/2022', customer: 'Walk-in' },
      { id: 1007, date: '04/03/2022', customer: 'Suresh' }
    ]
  };

  assert.deepEqual(
    orders.list(db, {}).map(function (order) { return order.id; }),
    [1008, 1007, 1004, 1001]
  );
  assert.deepEqual(
    orders.list(db, { from: '2022-01-01', to: '2022-01-31' }).map(function (order) { return order.id; }),
    [1004]
  );
});

test('Khata settlement converts request amounts to numbers and rejects invalid values', function () {
  var db = {
    nextSettlementId: 501,
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200
    }],
    settlements: []
  };

  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Part payment');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);

  [0, -1, 'not-a-number'].forEach(function (amount) {
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
  });
});
