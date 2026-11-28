const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');

test('invoice matches billed totals and line GST for HSN slabs and coupons', () => {
  const orders = [
    {
      id: 1001,
      items: [{ hsn: '0902', price: 140, qty: 2 }, { hsn: '0713', price: 165, qty: 2 }],
      subtotal: 610, discount: 0, tax: 66.90, total: 676.90,
      lineGst: [[18, 50.40], [5, 16.50]]
    },
    {
      id: 1002,
      items: [{ hsn: '1006', price: 640, qty: 1 }, { hsn: '1512', price: 190, qty: 2 }],
      coupon: 'SAVE10',
      subtotal: 1020, discount: 102, tax: 45.90, total: 963.90,
      lineGst: [[5, 28.80], [5, 17.10]]
    },
    {
      id: 1004,
      items: [{ hsn: '1508', price: 1120, qty: 2 }],
      coupon: 'SAVE10',
      subtotal: 2240, discount: 150, tax: 104.50, total: 2194.50,
      lineGst: [[5, 104.50]]
    }
  ];
  const figures = orders.map((order) => {
    const { subtotal, discount, tax, total, rows } = invoice.computeInvoiceFigures(order);
    return { subtotal, discount, tax, total, lineGst: rows.map((row) => [row.gstPercent, row.lineTax]) };
  });
  assert.deepEqual(figures, orders.map(({ subtotal, discount, tax, total, lineGst }) =>
    ({ subtotal, discount, tax, total, lineGst })
  ));
  assert.doesNotMatch(invoice.render(orders[1]), /Accountant Reconciliation Notice/);
});
