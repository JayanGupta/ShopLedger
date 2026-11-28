const assert = require('node:assert/strict');
const test = require('node:test');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

test('order history follows calendar dates and Khata settlements use numeric amounts', () => {
  const orderDb = {
    orders: [
      { id: 1, date: '28/12/2021' },
      { id: 2, date: '05/01/2022' },
      { id: 3, date: '30/01/2022' },
      { id: 4, date: '15/03/2022' },
      { id: 5, date: '15/03/2022' }
    ]
  };
  const ids = (filters) => orders.list(orderDb, filters).map((order) => order.id);

  const customer = {
    id: 1,
    name: 'Meera',
    openingBalance: 450,
    totalBilled: 1982.01,
    totalSettled: 1200,
    balance: 1232.01
  };
  const ledgerDb = { customers: [customer], settlements: [], nextSettlementId: 1 };
  const payment = ledger.recordSettlement(ledgerDb, 1, '500');
  const updatedBalance = customer.balance;
  const updatedTotalSettled = customer.totalSettled;
  const invalid = ['abc', '', ' ', 'Infinity', Infinity, NaN, 0, -10, null, true, [500]];
  const acceptedInvalidAmounts = invalid.map((amount) =>
    ledger.recordSettlement(ledgerDb, 1, amount).ok
  );

  assert.deepEqual({
    newestFirst: ids(),
    inclusiveRange: ids({ from: '2021-12-28', to: '2022-01-05' }),
    ledgerDateRange: ids({ from: '05/01/2022', to: '30/01/2022' }),
    settled: payment.ok,
    recordedAmount: payment.settlement.amount,
    updatedBalance,
    updatedTotalSettled,
    acceptedInvalidAmounts,
    settlementCount: ledgerDb.settlements.length,
    finalBalance: customer.balance
  }, {
    newestFirst: [5, 4, 3, 2, 1],
    inclusiveRange: [2, 1],
    ledgerDateRange: [3, 2],
    settled: true,
    recordedAmount: 500,
    updatedBalance: 732.01,
    updatedTotalSettled: 1700,
    acceptedInvalidAmounts: invalid.map(() => false),
    settlementCount: 1,
    finalBalance: 732.01
  });
});
