const assert = require('node:assert/strict');
const { test } = require('node:test');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function totals({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    // Saved lines can carry an HSN without an explicit GST rate.
    items: [
      { name: 'Toor Dal', price: 165, qty: 2, hsn: '0713', gstRate: undefined },
      { name: 'Table Butter', price: 280, qty: 1, hsn: '0405', gstRate: undefined },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 16.50],
    [12, 33.60],
  ]);

  assert.deepEqual(totals(checkout), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10,
  });
  assert.deepEqual(checkout.lines.map(({ gstPercent }) => gstPercent), [5, 12]);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before calculating GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Sunflower Oil', price: 190, qty: 2, hsn: '1512', gstRate: undefined },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 28.80],
    [5, 17.10],
  ]);

  assert.deepEqual(totals(checkout), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the ₹150 SAVE10 cap before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508', gstRate: undefined },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 104.50],
  ]);

  assert.deepEqual(totals(checkout), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree on 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Kokum Concentrate', price: 180, qty: 2, hsn: '2106', gstRate: undefined },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  };

  assert.deepEqual(totals(printed), expected);
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 25.20],
    [18, 64.80],
  ]);
  assert.deepEqual(totals(checkout), expected);
});

test('invoice matches checkout for mixed GST slabs with capped SAVE10', () => {
  const items = [
    { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
    { name: 'Table Butter', price: 240, qty: 4, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const checkout = totals(pricing.computeTotals(items, coupon));
  const order = { id: 1010, items, coupon, ...checkout };
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(checkout, {
    subtotal: 2240, discount: 150, tax: 167.20, cgst: 83.60, sgst: 83.60, total: 2257.20,
  });
  assert.deepEqual(totals(printed), checkout);
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 59.71],
    [12, 107.49],
  ]);

  const html = invoice.render(order);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹59\.71<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">₹107\.49<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2257\.20<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice:/);
});
