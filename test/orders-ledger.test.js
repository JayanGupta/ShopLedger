var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var dates = require('../lib/dates');
var ledger = require('../lib/ledger');

function order(id, date, status) {
  return {
    id: id,
    date: date,
    customer: 'Walk-in',
    status: status || 'completed',
    coupon: '',
    items: [],
    total: 1
  };
}

describe('dates.normalizeDateKey', function () {
  it('turns DD/MM/YYYY and YYYY-MM-DD into the same sortable key', function () {
    assert.equal(dates.normalizeDateKey('15/03/2022'), '2022-03-15');
    assert.equal(dates.normalizeDateKey('30/01/2022'), '2022-01-30');
    assert.equal(dates.normalizeDateKey('28/12/2021'), '2021-12-28');
    assert.equal(dates.normalizeDateKey('2022-03-15'), '2022-03-15');
    assert.equal(dates.normalizeDateKey('5/1/2022'), '2022-01-05');
    assert.equal(dates.normalizeDateKey('31/02/2022'), '');
    assert.equal(dates.normalizeDateKey(''), '');
  });

  it('keeps fiscal year based on the real month', function () {
    assert.equal(dates.getFiscalYear('15/03/2022'), 'FY21-22');
    assert.equal(dates.getFiscalYear('2022-04-15'), 'FY22-23');
  });
});

describe('orders.list', function () {
  var db = {
    orders: [
      order(1001, '28/12/2021'),
      order(1004, '30/01/2022'),
      order(1008, '15/03/2022'),
      order(1009, '15/03/2022')
    ]
  };

  it('sorts newest real date first, then higher id', function () {
    var ids = orders.list(db).map(function (row) { return row.id; });
    assert.deepEqual(ids, [1009, 1008, 1004, 1001]);
  });

  it('applies from/to filters sent as YYYY-MM-DD', function () {
    var march = orders.list(db, { from: '2022-03-01', to: '2022-03-31' })
      .map(function (row) { return row.id; });
    assert.deepEqual(march, [1009, 1008]);

    var january = orders.list(db, { from: '2022-01-01', to: '2022-01-31' })
      .map(function (row) { return row.id; });
    assert.deepEqual(january, [1004]);

    var onlyThatDay = orders.list(db, { from: '2022-01-30', to: '2022-01-30' })
      .map(function (row) { return row.id; });
    assert.deepEqual(onlyThatDay, [1004]);
  });

  it('still filters by status', function () {
    var mixed = {
      orders: [
        order(1, '01/02/2022', 'completed'),
        order(2, '02/02/2022', 'cancelled')
      ]
    };
    var ids = orders.list(mixed, { status: 'completed' }).map(function (row) { return row.id; });
    assert.deepEqual(ids, [1]);
  });
});

describe('ledger.recordSettlement', function () {
  function meeraDb() {
    return {
      nextSettlementId: 505,
      settlements: [],
      customers: [{
        id: 1,
        name: 'Meera Joshi',
        openingBalance: 450,
        totalBilled: 1982.01,
        totalSettled: 1200,
        balance: 1232.01
      }]
    };
  }

  function settled(db) {
    return {
      totalSettled: db.customers[0].totalSettled,
      balance: db.customers[0].balance
    };
  }

  it('accepts a numeric amount and a numeric string', function () {
    var numeric = meeraDb();
    var asNumber = ledger.recordSettlement(numeric, 1, 500, 'upi', 'part');
    assert.equal(asNumber.ok, true);
    assert.equal(asNumber.settlement.amount, 500);
    assert.deepEqual(settled(numeric), { totalSettled: 1700, balance: 732.01 });

    var text = meeraDb();
    var asString = ledger.recordSettlement(text, 1, '500', 'cash', 'counter');
    assert.equal(asString.ok, true);
    assert.equal(asString.settlement.amount, 500);
    assert.deepEqual(settled(text), { totalSettled: 1700, balance: 732.01 });
  });

  it('rejects zero, negative, and non-numeric amounts', function () {
    ['0', 0, -10, 'abc', '', null].forEach(function (amount) {
      var db = meeraDb();
      var result = ledger.recordSettlement(db, 1, amount, 'upi', '');
      assert.equal(result.ok, false);
      assert.deepEqual(settled(db), { totalSettled: 1200, balance: 1232.01 });
      assert.equal(db.settlements.length, 0);
    });
  });
});
