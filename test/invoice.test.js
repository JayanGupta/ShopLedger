const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('#1001 invoices the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 155, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' },
    ],
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(billed.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [
    [5, 15.50],
    [12, 36],
  ]);
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 15.50],
    [12, 36],
  ]);
  assert.deepEqual(amounts(billed), {
    subtotal: 610, discount: 0, tax: 51.50, cgst: 25.75, sgst: 25.75, total: 661.50,
  });
  assert.deepEqual(amounts(printed), {
    subtotal: 610, discount: 0, tax: 51.50, cgst: 25.75, sgst: 25.75, total: 661.50,
  });
});

test('#1002 applies SAVE10 before GST on the invoice', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Toor dal', price: 170, qty: 6, hsn: '0713' }],
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(amounts(billed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
  assert.deepEqual(amounts(printed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
});

test('#1004 invoice honors the SAVE10 cap on a ₹2,240 subtotal', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 280, qty: 8, hsn: '1006' }],
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(amounts(billed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assert.deepEqual(amounts(printed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 125, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 250, qty: 1, hsn: '0901', gstRate: 18 },
    ],
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [18, 45],
    [18, 45],
  ]);
  assert.deepEqual(amounts(printed), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  });
  assert.deepEqual(amounts(billed), amounts(printed));
});

test('invoice matches checkout for mixed HSN slabs with capped SAVE10', () => {
  const items = [
    { id: 1, name: 'Rice', price: 240, qty: 4, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 320, qty: 4, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon, ...amounts(billed) });

  assert.deepEqual(amounts(printed), {
    subtotal: 2240, discount: 150, tax: 188.10, cgst: 94.05, sgst: 94.05, total: 2278.10,
  });
  assert.deepEqual(amounts(printed), amounts(billed));
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 44.79],
    [12, 143.31],
  ]);

  const reprinted = invoice.computeInvoiceFigures({
    items, coupon: 'DIWALI20', ...amounts(billed),
  });
  assert.deepEqual(reprinted, printed);
});
