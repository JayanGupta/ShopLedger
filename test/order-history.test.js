const test = require('node:test');
const assert = require('node:assert/strict');
const dates = require('../lib/dates');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

function fixture() {
  return {
    orders: [
      { id: 1001, date: '28/12/2021' },
      { id: 1002, date: '05/01/2022' },
      { id: 1004, date: '30/01/2022' },
      { id: 1007, date: '04/03/2022' },
      { id: 1008, date: '15/03/2022' }
    ],
    customers: [{ id: 1, openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200 }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('orders sort newest first across months and years', () => {
  assert.deepEqual(orders.list(fixture()).map(order => order.id), [1008, 1007, 1004, 1002, 1001]);
});

test('the January filter excludes orders from other months and years', () => {
  const filters = { from: '2022-01-01', to: '2022-01-31' };
  assert.deepEqual(orders.list(fixture(), filters).map(order => order.id), [1004, 1002]);
});

test('fiscal years still change in April for either date format', () => {
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});

test('a text settlement is added numerically to settled funds', () => {
  const db = fixture();
  const result = ledger.recordSettlement(db, 1, '500');
  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 500);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
});

test('order date filters include both endpoints across year boundaries', () => {
  const db = fixture();
  assert.deepEqual(
    orders.list(db, { from: '28/12/2021', to: '2022-01-05' }).map(order => order.id),
    [1002, 1001]
  );
});

test('an invalid settlement does not modify the Khata account', () => {
  const db = fixture();
  for (const amount of ['bad', 'Infinity', ' ', true, '0.001']) {
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
  }
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.nextSettlementId, 501);
  assert.deepEqual(db.settlements, []);
});
