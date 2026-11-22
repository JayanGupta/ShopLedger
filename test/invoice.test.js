const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN rates', () => {
  // Checkout order lines carry HSN but omit gstRate.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 10], [12, 36]
  ]);
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [5, 10], [12, 36]
  ]);
  assert.equal(checkout.tax, 46);
  assert.equal(checkout.total, 546);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  // An explicit percentage keeps both calculators on the same GST rate.
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 200, qty: 5, hsn: '1006', gstRate: 5 }]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [[5, 45]]);
  assert.equal(checkout.discount, 100);
  assert.equal(checkout.tax, 45);
  assert.equal(checkout.total, 945);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the ₹150 SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 560, qty: 4, hsn: '0902' }]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [[18, 376.2]]);
  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for all-18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 300, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 36], [18, 54]
  ]);
  const { taxable, lines, ...checkoutFigures } = checkout;
  assert.deepEqual(figures, checkoutFigures);
});

test('invoice matches billed total and GST for a capped coupon on a 5% HSN line', () => {
  const items = [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = {
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [[5, 104.5]]);
});
