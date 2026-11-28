const test = require('node:test');
const assert = require('node:assert/strict');
const dates = require('../lib/dates');
const inventory = require('../lib/inventory');
const store = require('../lib/store');
const orderRoutes = require('../routes/orders');

function request(router, method, url, body) {
  return new Promise((resolve, reject) => {
    router.handle({ method, url, body }, {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { resolve({ status: this.statusCode, data }); }
    }, (error) => reject(error || new Error('Route did not send a response')));
  });
}

test('checkout sells the last sellable units while preserving wholesale reservations', async (t) => {
  const db = {
    products: [
      { id: 6, name: 'Ghee', hsn: '0405', price: 450, stock: 1, reserved: 0 },
      { id: 11, name: 'Chilli', hsn: '0904', price: 220, stock: 4, reserved: 3 }
    ],
    orders: [], nextOrderId: 1009
  };
  t.mock.method(store, 'read', () => db);
  const write = t.mock.method(store, 'write', () => {});
  const cart = { items: [{ id: 6, qty: 1 }, { id: 11, qty: 1 }] };

  const sold = await request(orderRoutes, 'POST', '/orders', cart);
  assert.equal(sold.status, 201);
  assert.deepEqual(db.products.map(({ stock, reserved }) => [stock, reserved]), [[0, 0], [3, 3]]);
  const soldOut = await request(orderRoutes, 'POST', '/orders', { items: [{ id: 11, qty: 1 }] });
  assert.equal(soldOut.status, 409);
  assert.match(soldOut.data.error, /0 sellable available/);
  assert.equal(write.mock.callCount(), 1);
});

test('multiple cart lines for the same product cannot consume wholesale reservations', () => {
  const products = [{ id: 11, name: 'Chilli', stock: 4, reserved: 1 }];
  assert.deepEqual(inventory.check(products, [{ id: 11, qty: 2 }, { id: '11', qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check(products, [{ id: 11, qty: 2 }, { id: '11', qty: 2 }]), {
    ok: false, msg: 'Chilli is out of stock (3 sellable available)'
  });
  assert.equal(products[0].stock, 4);
});

test('cancelling a pending Khata order restores stock and reverses the debit only once', async (t) => {
  const db = {
    products: [{ id: 6, stock: 1 }, { id: 4, stock: 5, reserved: 2 }],
    customers: [{ id: 4, openingBalance: 100, totalBilled: 1500, totalSettled: 1000 }],
    orders: [{
      id: 1007, status: 'pending', customerId: 4, paymentMode: 'khata', total: 1200,
      items: [{ id: 6, qty: 2 }, { id: 4, qty: '2' }]
    }]
  };
  t.mock.method(store, 'read', () => db);
  const write = t.mock.method(store, 'write', () => {});

  const cancelled = await request(orderRoutes, 'POST', '/orders/1007/cancel', { reason: 'Customer request' });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.status, 'cancelled');
  assert.equal(cancelled.data.cancelReason, 'Customer request');
  assert.equal(cancelled.data.cancelledAt, dates.today());
  assert.equal(db.customers[0].totalBilled, 300);
  assert.equal(db.customers[0].balance, -600);
  assert.deepEqual(db.products.map(({ stock, reserved }) => [stock, reserved]), [[3, undefined], [7, 2]]);

  const after = structuredClone(db);
  const repeated = await request(orderRoutes, 'POST', '/orders/1007/cancel');
  assert.equal(repeated.status, 400);
  assert.match(repeated.data.error, /already cancelled/);
  assert.deepEqual(db, after);
  assert.equal(write.mock.callCount(), 1);
});

test('wholesale quote release still clears reservations without adding physical stock', () => {
  const products = [{ id: 11, stock: 4, reserved: 3 }];
  inventory.release(products, [{ productId: 11, qty: 2 }]);
  assert.deepEqual(products, [{ id: 11, stock: 4, reserved: 1 }]);
});
