const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');
const store = require('../lib/store');
const customerRoutes = require('../routes/customers');

test('order dates sort/filter chronologically and settlements preserve numeric balances', (t) => {
  const db = {
    orders: [
      { id: 1, date: '28/12/2021', customer: 'Walk-in', status: 'completed' },
      { id: 2, date: '05/01/2022', customer: 'Meera', status: 'completed', coupon: 'SAVE10' },
      { id: 3, date: '30/01/2022', customer: 'Meera', status: 'cancelled' },
      { id: 4, date: '02/02/2022', customer: 'Walk-in', status: 'completed' },
      { id: 5, date: '15/03/2022', customer: 'Walk-in', status: 'completed' },
      { id: 6, date: '05/01/2022', customer: 'Meera', status: 'pending' }
    ],
    customers: [{ id: 1, name: 'Meera', openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200, balance: 1232.01 }],
    settlements: [], nextSettlementId: 1, auditLog: []
  };
  const originalOrders = structuredClone(db.orders);
  const ids = filters => orders.list(db, filters).map(order => order.id);
  assert.deepEqual(ids(), [5, 4, 3, 2, 6, 1], 'newest real date first; same-date order stays stable');
  assert.deepEqual(ids({ from: '2021-12-28', to: '2022-01-05' }), [2, 6, 1], 'inclusive ISO bounds');
  assert.deepEqual(ids({ from: '28/12/2021', to: '05/01/2022' }), [2, 6, 1], 'inclusive DD/MM/YYYY bounds');
  assert.deepEqual(ids({ from: '2022-02-01' }), [5, 4], 'from only across months');
  assert.deepEqual(ids({ to: '2022-01-05' }), [2, 6, 1], 'to only across years');
  assert.deepEqual(ids({ from: '2022-03-01', to: '2022-01-01' }), [], 'reversed interval');
  assert.deepEqual(ids({ status: 'completed', search: 'save10' }), [2], 'existing status and search filters');
  assert.deepEqual(db.orders, originalOrders, 'listing does not reorder stored orders');
  assert.equal(dates.normalizeDateKey('05/01/2022'), dates.normalizeDateKey('2022-01-05'));
  assert.equal(dates.today().split('/').length, 3, 'stored dates remain DD/MM/YYYY');
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');

  // Exercise the real route handler with an in-memory store; no server or database I/O.
  let writes = 0;
  t.mock.method(store, 'read', () => db);
  t.mock.method(store, 'write', value => { assert.equal(value, db); writes++; });
  const settle = customerRoutes.stack.find(layer => layer.route && layer.route.path === '/customers/:id/settle').route.stack[0].handle;
  function request(amount) {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    settle({ params: { id: '1' }, body: { amount, mode: 'cash' } }, response);
    return response;
  }
  const response = request('500');
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.customer.totalSettled, 1700);
  assert.equal(response.body.customer.balance, 732.01, 'Meera balance after a 500 settlement');
  assert.equal(response.body.settlement.amount, 500);
  assert.equal(ledger.listCustomers(db)[0].balance, 732.01);
  assert.equal(writes, 1);

  for (const amount of [0, -1, '', ' ', 'oops', '500oops', 'Infinity', '1e309', Infinity, NaN, null, undefined, true, false, [], [500], {}, 0.001]) {
    const before = structuredClone(db);
    const invalid = request(amount);
    assert.equal(invalid.statusCode, 400, 'invalid amount: ' + String(amount));
    assert.deepEqual(db, before, 'invalid settlement must not mutate data');
    assert.equal(writes, 1, 'invalid settlement must not persist');
  }
  db.customers[0].totalSettled = '1700';
  const numeric = request(0.1);
  assert.equal(numeric.body.customer.totalSettled, 1700.10, 'existing numeric strings are added numerically');
  assert.equal(numeric.body.customer.balance, 731.91);
  assert.equal(request('0.20').body.customer.totalSettled, 1700.30, 'decimal settlements round to cents');
  assert.equal(db.customers[0].balance, 731.71);
});
