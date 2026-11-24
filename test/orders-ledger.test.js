var assert = require('node:assert');
var test = require('node:test');
var dates = require('../lib/dates');
var ledger = require('../lib/ledger');
var orders = require('../lib/orders');

function order(id, date) {
  return { id: id, date: date, customer: 'Customer ' + id };
}

function settlementDb() {
  return {
    nextSettlementId: 501,
    customers: [{
      id: 7,
      name: 'Meera Stores',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: []
  };
}

test('orders use real dates for newest-first filtering and settlements coerce JSON amounts', function () {
  var ordersDb = {
    orders: [
      order(1, '15/03/2022'),
      order(2, '30/01/2022'),
      order(3, '28/12/2021')
    ]
  };
  var settlementData = settlementDb();
  var settlement = ledger.recordSettlement(settlementData, 7, '500', 'upi', 'JSON request value');

  assert.deepStrictEqual(orders.list(ordersDb).map(function (o) { return o.id; }), [1, 2, 3]);
  assert.deepStrictEqual(orders.list(ordersDb, {
    from: '2022-01-01',
    to: '2022-02-28'
  }).map(function (o) { return o.id; }), [2]);
  assert.strictEqual(settlement.ok, true);
  assert.strictEqual(settlement.customer.totalSettled, 1700);
  assert.strictEqual(settlement.customer.balance, 732.01);
  assert.strictEqual(settlement.settlement.amount, 500);
});

test('orders.list sorts mixed DD/MM/YYYY dates newest first', function () {
  var db = { orders: [order(1, '15/03/2022'), order(2, '30/01/2022'), order(3, '28/12/2021')] };
  assert.deepStrictEqual(orders.list(db).map(function (o) { return o.id; }), [1, 2, 3]);
});

test('orders.list applies YYYY-MM-DD date filters to DD/MM/YYYY order dates', function () {
  var db = { orders: [order(1, '15/03/2022'), order(2, '30/01/2022'), order(3, '28/12/2021')] };
  assert.deepStrictEqual(orders.list(db, { from: '2022-01-01' }).map(function (o) { return o.id; }), [1, 2]);
  assert.deepStrictEqual(orders.list(db, { to: '2022-02-28' }).map(function (o) { return o.id; }), [2, 3]);
  assert.deepStrictEqual(orders.list(db, { from: '2022-01-01', to: '2022-02-28' }).map(function (o) { return o.id; }), [2]);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey converts ISO input but otherwise preserves trimmed text', function () {
  assert.strictEqual(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.strictEqual(dates.normalizeDateKey(' 15/03/2022 '), '15/03/2022');
  assert.strictEqual(dates.normalizeDateKey('2022-3-5'), '5/3/2022');
  assert.strictEqual(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement adds a numeric amount to the customer balance', function () {
  var db = settlementDb();
  var result = ledger.recordSettlement(db, 7, 500, 'cash', 'Counter payment');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
  assert.strictEqual(result.settlement.id, 501);
  assert.match(result.settlement.date, /^\d{2}\/\d{2}\/\d{4}$/);
});

test('ledger.recordSettlement coerces a string amount before updating totalSettled', function () {
  var db = settlementDb();
  var result = ledger.recordSettlement(db, 7, '500', 'upi', 'JSON request value');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
});

test('ledger.recordSettlement rejects zero, negative, and non-numeric amounts', function () {
  var zeroDb = settlementDb();
  var zero = ledger.recordSettlement(zeroDb, 7, 0);
  assert.deepStrictEqual(zero, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.strictEqual(zeroDb.customers[0].totalSettled, 1200);
  assert.strictEqual(zeroDb.settlements.length, 0);
  var negativeDb = settlementDb();
  var negative = ledger.recordSettlement(negativeDb, 7, -1);
  assert.deepStrictEqual(negative, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.strictEqual(negativeDb.customers[0].totalSettled, 1200);
  assert.strictEqual(negativeDb.settlements.length, 0);
  var textDb = settlementDb();
  var text = ledger.recordSettlement(textDb, 7, 'not-a-number');
  assert.deepStrictEqual(text, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.strictEqual(textDb.customers[0].totalSettled, 1200);
  assert.strictEqual(textDb.settlements.length, 0);
});
