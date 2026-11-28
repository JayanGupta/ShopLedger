const test = require('node:test');
const assert = require('node:assert/strict');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');
const orders = require('../lib/orders');
const store = require('../lib/store');
const customerRoutes = require('../routes/customers');

function request(router, method, url, body) {
  return new Promise((resolve, reject) => {
    router.handle({ method, url, body }, {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { resolve({ status: this.statusCode, data }); }
    }, (error) => reject(error || new Error('Route did not send a response')));
  });
}

test('order history sorts across months and years, with newer orders first on the same day', () => {
  const db = { orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1004, date: '30/01/2022' },
    { id: 1007, date: '04/03/2022' },
    { id: 1008, date: '15/03/2022' },
    { id: 1009, date: '2022-03-15' }
  ] };

  assert.deepEqual(orders.list(db).map((order) => order.id), [1009, 1008, 1007, 1004, 1001]);
  assert.deepEqual(db.orders.map((order) => order.id), [1001, 1004, 1007, 1008, 1009]);
});

test('order history includes both endpoints of a range from the date picker', () => {
  const db = { orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1004, date: '30/01/2022' },
    { id: 1007, date: '04/03/2022' },
    { id: 1008, date: '2022-03-15' }
  ] };

  assert.deepEqual(orders.list(db, { from: '2022-01-30', to: '2022-03-04' }).map((order) => order.id), [1007, 1004]);
  assert.deepEqual(orders.list(db, { from: '15/03/2022' }).map((order) => order.id), [1008]);
  assert.deepEqual(orders.list(db, { to: '2021-12-28' }).map((order) => order.id), [1001]);
});

test('order history still combines status and case-insensitive search filters', () => {
  const db = { orders: [
    { id: 1, date: '01/03/2022', customer: 'Meera', coupon: 'SAVE10' },
    { id: 2, date: '02/03/2022', status: 'pending', customer: 'Meera', coupon: 'SAVE10' },
    { id: 3, date: '03/03/2022', status: 'completed', customer: 'Suresh' }
  ] };

  assert.deepEqual(orders.list(db, { status: 'completed', search: '  save10  ' }).map((order) => order.id), [1]);
  assert.deepEqual(orders.list(db, { status: 'pending', search: 'MEERA' }).map((order) => order.id), [2]);
});

test('fiscal year labels still roll over in April and accept both date formats', () => {
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
  assert.equal(dates.getFiscalYear(), 'FY21-22');
});

test('the Khata settlement endpoint adds a payment entered as text', async (t) => {
  const db = {
    customers: [{ id: 1, name: 'Meera Joshi', openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200 }],
    settlements: [], nextSettlementId: 501
  };
  t.mock.method(store, 'read', () => db);
  const write = t.mock.method(store, 'write', () => {});

  assert.equal(ledger.listCustomers(db)[0].balance, 1232.01);
  const response = await request(customerRoutes, 'POST', '/customers/1/settle', { amount: '500' });

  assert.equal(response.status, 201);
  assert.equal(response.data.customer.totalSettled, 1700);
  assert.equal(response.data.customer.balance, 732.01);
  assert.equal(response.data.settlement.amount, 500);
  assert.equal(db.settlements[0], response.data.settlement);
  assert.equal(ledger.listCustomers(db)[0].balance, 732.01);
  assert.equal(write.mock.callCount(), 1);
});

test('settlements handle missing or numeric-string totals and keep cent precision', () => {
  const db = { customers: [{ id: 1, totalBilled: 10 }], nextSettlementId: 1 };
  assert.equal(ledger.recordSettlement(db, 1, 0.1).customer.totalSettled, 0.1);
  db.customers[0].totalSettled = '0.10';
  const result = ledger.recordSettlement(db, 1, '0.20');
  assert.equal(result.customer.totalSettled, 0.3);
  assert.equal(result.customer.balance, 9.7);
});

test('invalid settlements leave the customer and settlement history unchanged', () => {
  const db = { customers: [{ id: 1, totalSettled: 1200 }], settlements: [], nextSettlementId: 501 };
  const before = structuredClone(db);

  for (const amount of ['', 'abc', 'Infinity', 0, -1, true]) {
    assert.deepEqual(ledger.recordSettlement(db, 1, amount), {
      ok: false, error: 'Settlement amount must be greater than zero'
    });
    assert.deepEqual(db, before);
  }
});
