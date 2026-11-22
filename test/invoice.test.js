const test = require('node:test');
const { strict: assert } = require('node:assert');
const config = require('../config');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('invoice matches checkout for mixed GST slabs and capped SAVE10 before tax', (t) => {
  const items = [
    { name: 'Rice', price: 500.05, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 750, qty: 2, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { id: 1, items, coupon, ...amounts(checkout) };
  const expected = {
    subtotal: 2500.10, discount: 150, tax: 216.21, cgst: 108.11, sgst: 108.10, total: 2566.31,
  };

  assert.deepEqual(amounts(checkout), expected);
  const figures = invoice.computeInvoiceFigures(order);
  assert.deepEqual(amounts(figures), expected);
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 47.01],
    [12, 169.20],
  ]);
  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2566\.31<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const save10 = config.coupons.SAVE10;
  t.after(() => { config.coupons.SAVE10 = save10; });
  config.coupons.SAVE10 = { ...save10, active: false };

  assert.deepEqual(invoice.computeInvoiceFigures(order), figures);
  assert.equal(invoice.render(order), html);
});

test('CURRENT BEHAVIOUR: #1001-style invoice uses the 5% and 12% HSN slabs', () => {
  // These order lines carry HSNs but no explicit gstRate.
  const order = {
    items: [
      { id: 1, name: 'Ghee', price: 260, qty: 1, hsn: '0405' },
      { id: 2, name: 'Dal', price: 165, qty: 2, hsn: '0713' },
    ],
    coupon: '',
  };

  const figures = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(figures), {
    subtotal: 590, discount: 0, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70,
  });
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [12, 31.20],
    [5, 16.50],
  ]);
  assert.deepEqual(amounts(checkout), {
    subtotal: 590, discount: 0, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70,
  });
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [12, 31.20],
    [5, 16.50],
  ]);
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', () => {
  const order = {
    items: [
      { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { id: 2, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' },
    ],
    coupon: 'SAVE10',
  };

  const figures = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(figures), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 28.80],
    [5, 17.10],
  ]);
  assert.deepEqual(amounts(checkout), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
});

test('CURRENT BEHAVIOUR: #1004-style invoice applies the SAVE10 cap', () => {
  const order = {
    items: [{ id: 1, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }],
    coupon: 'SAVE10',
  };

  const figures = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(figures), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 104.50],
  ]);
  assert.deepEqual(amounts(checkout), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    items: [
      { id: 1, name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 2, name: 'Syrup', price: 180, qty: 2, hsn: '2106' },
    ],
    coupon: '',
  };

  const figures = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(figures), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  });
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 25.20],
    [18, 64.80],
  ]);
  assert.deepEqual(amounts(checkout), amounts(figures));
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [18, 25.20],
    [18, 64.80],
  ]);
});
