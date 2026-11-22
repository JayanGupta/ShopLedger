const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(order) {
  const figures = invoice.computeInvoiceFigures(order);
  const { rows, ...summary } = figures;
  const checkout = pricing.computeTotals(order.items, order.coupon);
  return { summary, rows, checkout };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% checkout HSN slabs', () => {
  // Checkout order lines carry HSN but omit the explicit GST rate.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', hsn: '1006', price: 100, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 300, qty: 1 },
    ],
  };

  const { summary, rows, checkout } = calculate(order);
  assert.deepEqual(summary, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 10],
    [12, 36],
  ]);
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [5, 10],
    [12, 36],
  ]);
  assert.equal(checkout.tax, 46);
  assert.equal(checkout.total, 546);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 reduces the taxable amount before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', hsn: '0902', price: 400, qty: 2 }],
  };

  const { summary, rows, checkout } = calculate(order);
  assert.deepEqual(summary, {
    subtotal: 800, discount: 80, tax: 129.6, cgst: 64.8, sgst: 64.8, total: 849.6,
  });
  assert.equal(rows[0].gstPercent, 18);
  assert.equal(rows[0].lineTax, 129.6);
  assert.equal(checkout.discount, 80);
  assert.equal(checkout.tax, 129.6);
  assert.equal(checkout.total, summary.total);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 discount cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Coffee', hsn: '0901', price: 560, qty: 4 }],
  };

  const { summary, rows, checkout } = calculate(order);
  assert.deepEqual(summary, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
  });
  assert.equal(rows[0].gstPercent, 18);
  assert.equal(rows[0].lineTax, 376.2);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice matches checkout without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 100, qty: 2 },
      { name: 'Coffee', hsn: '0901', gstRate: 18, price: 300, qty: 1 },
    ],
  };

  const { summary, rows, checkout } = calculate(order);
  assert.deepEqual(summary, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 36],
    [18, 54],
  ]);
  assert.equal(checkout.tax, summary.tax);
  assert.equal(checkout.cgst, summary.cgst);
  assert.equal(checkout.sgst, summary.sgst);
  assert.equal(checkout.total, summary.total);
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 560, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 1120, qty: 1 },
    ],
  };

  const { summary, rows, checkout } = calculate(order);
  const { lines, taxable, ...billed } = checkout;

  assert.equal(billed.discount, 150);
  assert.deepEqual(summary, billed);
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 52.25],
    [12, 125.4],
  ]);
});
