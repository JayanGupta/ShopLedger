const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');

const rice = { name: 'Rice', hsn: '1006', price: 510, qty: 2 };
const couponOrder = { id: 1002, items: [rice], coupon: 'SAVE10', total: 963.90 };

test('invoice preserves the GST row for an explicit 18% item', () => {
  const figures = invoice.computeInvoiceFigures({
    items: [{ ...rice, hsn: '0902', gstRate: 18 }]
  });
  assert.equal(figures.rows[0].gstPercent, 18);
  assert.equal(figures.rows[0].lineTax, 183.60);
  assert.equal(figures.total, 1203.60);
});

test('SAVE10 invoice uses the HSN slab and taxes the discounted amount', () => {
  const figures = invoice.computeInvoiceFigures(couponOrder);
  assert.equal(figures.discount, 102);
  assert.equal(figures.tax, 45.90);
  assert.equal(figures.cgst, 22.95);
  assert.equal(figures.sgst, 22.95);
  assert.equal(figures.total, couponOrder.total);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 45.90);
});

test('the invoice applies the SAVE10 cap before GST', () => {
  const figures = invoice.computeInvoiceFigures({
    coupon: 'SAVE10',
    items: [{ ...rice, price: 1120 }]
  });
  assert.equal(figures.discount, 150);
  assert.equal(figures.tax, 104.50);
  assert.equal(figures.total, 2194.50);
});

test('mixed HSN slabs and explicit zero-rate items are preserved', () => {
  const figures = invoice.computeInvoiceFigures({
    items: [rice, { ...rice, hsn: '0405' }, { ...rice, gstRate: 0 }]
  });
  assert.deepEqual(figures.rows.map(row => row.gstPercent), [5, 12, 0]);
  assert.equal(figures.tax, 173.40);
});

test('invoice HTML shows the corrected total and keeps reconciliation for real discrepancies', () => {
  const html = invoice.render(couponOrder);
  assert.match(html, /Invoice Total<\/td><td class="r">₹963\.90/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.match(invoice.render({ ...couponOrder, total: 960 }), /Accountant Reconciliation Notice/);
});
