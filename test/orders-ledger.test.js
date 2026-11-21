const { test } = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

const history = {
  orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1004, date: '30/01/2022' },
    { id: 1008, date: '15/03/2022' }
  ]
};

test('Order History sorts newest first', () => {
  assert.deepEqual(orders.list(history).map(order => order.id), [1008, 1004, 1001]);

  const sameDayHistory = {
    orders: [...history.orders, { id: 1009, date: '15/03/2022' }]
  };
  assert.deepEqual(orders.list(sameDayHistory).map(order => order.id), [1009, 1008, 1004, 1001]);
});

test('a cross-month date range includes both boundary orders', () => {
  const filters = { from: '2022-01-30', to: '2022-03-15' };
  assert.deepEqual(orders.list(history, filters).map(order => order.id), [1008, 1004]);
});

function khataFixture() {
  return {
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: [],
    nextSettlementId: 1
  };
}

test('a string settlement adds to Total Settled', () => {
  const db = khataFixture();
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(db.settlements[0].amount, 500);
});

test('CURRENT BEHAVIOUR: a numeric settlement adds to Total Settled', () => {
  const db = khataFixture();
  const result = ledger.recordSettlement(db, 1, 500);

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 1700);
  assert.equal(db.customers[0].balance, 732.01);
  assert.equal(db.settlements[0].amount, 500);
});

test('a string settlement reduces the balance by the amount recorded', () => {
  const db = khataFixture();
  const previousBalance = db.customers[0].balance;
  const result = ledger.recordSettlement(db, 1, '500');

  assert.equal(result.ok, true);
  assert.equal(previousBalance - result.customer.balance, result.settlement.amount);
});
