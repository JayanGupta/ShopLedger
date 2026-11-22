const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(id, items, coupon = '') {
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ ...checkout, id, items, coupon });
  return { checkout, printed };
}

function assertAmounts(figures, expected) {
  const { subtotal, discount, tax, cgst, sgst, total } = figures;
  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, expected);
}

test('CURRENT BEHAVIOUR: #1001 prints the 5% and 12% HSN slabs', () => {
  // New order lines carry HSN but no explicit gstRate.
  const items = [
    { name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006' },
    { name: 'Ghee', sku: 'GHEE', price: 200, qty: 1, hsn: '0405' }
  ];
  const { checkout, printed } = calculate(1001, items);

  assert.deepEqual(checkout.lines.map(line => line.gstPercent), [5, 12]);
  assert.equal(checkout.tax, 56);
  assert.equal(checkout.total, 896);
  assertAmounts(printed, {
    subtotal: 840, discount: 0, tax: 56, cgst: 28, sgst: 28, total: 896
  });
  assert.deepEqual(printed.rows, [
    { ...items[0], gstPercent: 5, line: 640, lineTax: 32 },
    { ...items[1], gstPercent: 12, line: 200, lineTax: 24 }
  ]);
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST', () => {
  const items = [{ name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: 18 }];
  const { checkout, printed } = calculate(1002, items, 'SAVE10');

  assert.equal(checkout.discount, 60);
  assert.equal(checkout.tax, 97.20);
  assert.equal(checkout.total, 637.20);
  assertAmounts(printed, {
    subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20
  });
  assert.deepEqual(printed.rows, [
    { name: 'Tea', sku: '-', price: 300, qty: 2, hsn: '0902', gstPercent: 18, line: 600, lineTax: 97.20 }
  ]);
});

test('CURRENT BEHAVIOUR: #1004 applies the SAVE10 cap on the invoice', () => {
  const items = [{ name: 'Rice', price: 560, qty: 4, hsn: '1006', gstRate: 5 }];
  const { checkout, printed } = calculate(1004, items, 'SAVE10');

  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.50);
  assert.equal(checkout.total, 2194.50);
  assertAmounts(printed, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepEqual(printed.rows, [
    { name: 'Rice', sku: '-', price: 560, qty: 4, hsn: '1006', gstPercent: 5, line: 2240, lineTax: 104.50 }
  ]);
});

test('CURRENT BEHAVIOUR: #1008 matches checkout with all 18% items and no coupon', () => {
  const items = [
    { name: 'Tea', sku: 'TEA', price: 250, qty: 1, hsn: '0902' },
    { name: 'Coffee', sku: 'COFFEE', price: 350, qty: 2, hsn: '0901', gstRate: 18 }
  ];
  const { checkout, printed } = calculate(1008, items);
  const expected = {
    subtotal: 950, discount: 0, tax: 171, cgst: 85.50, sgst: 85.50, total: 1121
  };

  assertAmounts(checkout, expected);
  assertAmounts(printed, expected);
  assert.deepEqual(printed.rows, [
    { ...items[0], gstPercent: 18, line: 250, lineTax: 45 },
    { name: 'Coffee', sku: 'COFFEE', price: 350, qty: 2, hsn: '0901', gstPercent: 18, line: 700, lineTax: 126 }
  ]);
});

test('invoice matches checkout for mixed HSN slabs with capped SAVE10', () => {
  const items = [
    { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 240, qty: 4, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const { subtotal, discount, tax, cgst, sgst, total } = pricing.computeTotals(items, coupon);
  const order = { id: 2001, items, coupon, subtotal, discount, tax, total };
  const printed = invoice.computeInvoiceFigures(order);

  assertAmounts(printed, { subtotal, discount, tax, cgst, sgst, total });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 59.71 },
    { gstPercent: 12, lineTax: 107.49 }
  ]);
  const html = invoice.render(order);
  assert.match(html, /<td>Invoice Total<\/td><td class="r">₹2257\.20<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const couponConfig = require('../config').coupons[coupon];
  const wasActive = couponConfig.active;
  try {
    couponConfig.active = false;
    assert.equal(pricing.computeTotals(items, coupon).discount, 0);
    assert.deepEqual(invoice.computeInvoiceFigures(order), printed);
  } finally {
    couponConfig.active = wasActive;
  }
});
