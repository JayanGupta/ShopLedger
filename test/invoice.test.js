const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('#1001 invoices 5% and 12% GST using the item HSN codes', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 250, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...totals } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(checkout.lines.map(({ gstPercent }) => gstPercent), [5, 12]);
  assert.equal(checkout.tax, 61);
  assert.equal(checkout.total, 861);
  assert.deepEqual(totals, {
    subtotal: 800, discount: 0, tax: 61, cgst: 30.50, sgst: 30.50, total: 861
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 25],
    [12, 36]
  ]);
});

test('#1002 invoices GST after applying SAVE10', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 510, qty: 2, hsn: '1006' }]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...totals } = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.90);
  assert.equal(checkout.total, 963.90);
  assert.deepEqual(totals, {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.equal(rows[0].gstPercent, 5);
  assert.equal(rows[0].lineTax, 45.90);
});

test('#1004 caps SAVE10 at ₹150 and taxes the discounted amount', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 1120, qty: 2, hsn: '0902', gstRate: 18 }]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...totals } = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.20);
  assert.equal(checkout.total, 2466.20);
  assert.deepEqual(totals, {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20
  });
  assert.equal(rows[0].gstPercent, 18);
  assert.equal(rows[0].lineTax, 376.20);
});

test('#1008 matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 200, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 150, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...totals } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals, {
    subtotal: 550, discount: 0, tax: 99, cgst: 49.50, sgst: 49.50, total: 649
  });
  assert.equal(totals.subtotal, checkout.subtotal);
  assert.equal(totals.discount, checkout.discount);
  assert.equal(totals.tax, checkout.tax);
  assert.equal(totals.cgst, checkout.cgst);
  assert.equal(totals.sgst, checkout.sgst);
  assert.equal(totals.total, checkout.total);
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 72],
    [18, 27]
  ]);
});
