const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');

const rice = { name: 'Rice', hsn: '1006', price: 510, qty: 2 };
const couponOrder = { id: 1002, items: [rice], coupon: 'SAVE10', total: 963.90 };

test('CURRENT BEHAVIOUR: invoice adds 18% GST and discounts the taxed subtotal', () => {
  const figures = invoice.computeInvoiceFigures(couponOrder);
  assert.equal(figures.tax, 183.60);
  assert.equal(figures.discount, 120.36);
  assert.equal(figures.total, 1083.24);
});

test('invoice preserves the GST row for an explicit 18% item', () => {
  const figures = invoice.computeInvoiceFigures({
    items: [{ ...rice, hsn: '0902', gstRate: 18 }]
  });
  assert.equal(figures.rows[0].gstPercent, 18);
  assert.equal(figures.rows[0].lineTax, 183.60);
  assert.equal(figures.total, 1203.60);
});
