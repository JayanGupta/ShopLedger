const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(actual, expected) {
  const { subtotal, discount, tax, cgst, sgst, total } = actual;
  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, expected);
}

// These are synthetic carts. Lines without gstRate exercise the HSN and fallback paths.
test('CURRENT BEHAVIOUR: #1001-style invoice uses the 5% and 12% HSN slabs', () => {
  const items = [
    { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
    { name: 'Ghee', price: 200, qty: 1, hsn: '0405' },
  ];
  const coupon = '';
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon });

  assertFigures(checkout, {
    subtotal: 840, discount: 0, tax: 56, cgst: 28, sgst: 28, total: 896,
  });
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [5, 32],
    [12, 24],
  ]);
  assertFigures(printed, {
    subtotal: 840, discount: 0, tax: 56, cgst: 28, sgst: 28, total: 896,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 32],
    [12, 24],
  ]);
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', () => {
  const items = [{ name: 'Rice', price: 640, qty: 1, hsn: '1006' }];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon });

  assertFigures(checkout, {
    subtotal: 640, discount: 64, tax: 28.80, cgst: 14.40, sgst: 14.40, total: 604.80,
  });
  assertFigures(printed, {
    subtotal: 640, discount: 64, tax: 28.80, cgst: 14.40, sgst: 14.40, total: 604.80,
  });
  assert.equal(printed.rows[0].lineTax, 28.80);
});

test('CURRENT BEHAVIOUR: #1004-style invoice respects the SAVE10 cap on ₹2,240', () => {
  const items = [{ name: 'Rice', price: 560, qty: 4, hsn: '1006' }];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon });

  assertFigures(checkout, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assertFigures(printed, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assert.equal(printed.rows[0].lineTax, 104.50);
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for 18% items without a coupon', () => {
  const items = [
    { name: 'Tea', price: 300, qty: 1, hsn: '0902' },
    { name: 'Coffee', price: 125, qty: 2, hsn: '0901', gstRate: 18 },
  ];
  const coupon = '';
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon });
  const expected = {
    subtotal: 550, discount: 0, tax: 99, cgst: 49.50, sgst: 49.50, total: 649,
  };

  assertFigures(checkout, expected);
  assertFigures(printed, expected);
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 54],
    [18, 45],
  ]);
});

test('invoice matches a mixed-slab checkout with capped SAVE10', () => {
  const items = [
    { name: 'Rice', price: 800, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 320, qty: 2, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { id: 1, items, coupon, total: checkout.total };
  const printed = invoice.computeInvoiceFigures(order);

  assertFigures(checkout, {
    subtotal: 2240, discount: 150, tax: 146.30, cgst: 73.15, sgst: 73.15, total: 2236.30,
  });
  assertFigures(printed, {
    subtotal: 2240, discount: 150, tax: 146.30, cgst: 73.15, sgst: 73.15, total: 2236.30,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 74.64],
    [12, 71.66],
  ]);
  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2236\.30/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
