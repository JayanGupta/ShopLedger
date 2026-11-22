const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function financialSummary({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs without gstRate', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 100, qty: 1, hsn: '0405' }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(financialSummary(printed), {
    subtotal: 300, discount: 0, tax: 22, cgst: 11, sgst: 11, total: 322
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 10], [12, 12]
  ]);
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [5, 10], [12, 12]
  ]);
  assert.equal(checkout.total, 322);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 250, qty: 4, hsn: '1006', gstRate: 5 }]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(financialSummary(printed), {
    subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945
  });
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.rows[0].lineTax, 45);
  assert.equal(checkout.discount, 100);
  assert.equal(checkout.tax, 45);
  assert.equal(checkout.total, 945);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the ₹150 SAVE10 cap on ₹2,240', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 560, qty: 4, hsn: '0902' }]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(financialSummary(printed), {
    subtotal: 2240, discount: 150, tax: 376.2,
    cgst: 188.1, sgst: 188.1, total: 2466.2
  });
  assert.equal(printed.rows[0].gstPercent, 18);
  assert.equal(printed.rows[0].lineTax, 376.2);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice matches checkout without a coupon', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Tea', price: 120, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 160, qty: 1, hsn: '0901' }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(financialSummary(printed), {
    subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 43.2], [18, 28.8]
  ]);
  assert.deepEqual(financialSummary(printed), financialSummary(checkout));
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 200, qty: 10, hsn: '1006' },
      { name: 'Ghee', price: 120, qty: 2, hsn: '0405' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(financialSummary(checkout), {
    subtotal: 2240, discount: 150, tax: 120.17,
    cgst: 60.09, sgst: 60.08, total: 2210.17
  });
  assert.deepEqual(financialSummary(printed), financialSummary(checkout));
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 93.3], [12, 26.87]
  ]);

  // This order was billed while the coupon was active.
  const historicalOrder = {
    coupon: 'DIWALI20',
    items: [{ name: 'Tea', price: 250, qty: 4, hsn: '0902' }],
    subtotal: 1000, discount: 200, tax: 144, total: 944
  };
  const reprint = invoice.computeInvoiceFigures(historicalOrder);

  assert.deepEqual(financialSummary(reprint), {
    subtotal: 1000, discount: 200, tax: 144, cgst: 72, sgst: 72, total: 944
  });
  assert.equal(reprint.rows[0].lineTax, 144);
});
