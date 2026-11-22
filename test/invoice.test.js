const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculateOrder(id, items, coupon = '') {
  const checkout = pricing.computeTotals(items, coupon);
  const { subtotal, discount, tax, total } = checkout;
  const order = { id, items, coupon, subtotal, discount, tax, total };
  return { checkout, printable: invoice.computeInvoiceFigures(order) };
}

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function invoiceLineGst({ rows }) {
  return rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }));
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  const items = [
    { name: 'Dal', price: 165, qty: 2, hsn: '0713' },
    { name: 'Chilli powder', price: 140, qty: 2, hsn: '0904' }
  ];
  const { checkout, printable } = calculateOrder(1001, items);

  assert.deepEqual(amounts(checkout), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
  assert.deepEqual(amounts(printable), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
  assert.deepEqual(invoiceLineGst(printable), [
    { gstPercent: 5, lineTax: 16.50 },
    { gstPercent: 12, lineTax: 33.60 }
  ]);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [
    { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
    { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
  ];
  const { checkout, printable } = calculateOrder(1002, items, 'SAVE10');

  assert.deepEqual(amounts(checkout), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepEqual(amounts(printable), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepEqual(invoiceLineGst(printable), [
    { gstPercent: 5, lineTax: 28.80 },
    { gstPercent: 5, lineTax: 17.10 }
  ]);
});

test('CURRENT BEHAVIOUR: #1004 invoice respects the SAVE10 cap on a 2240 subtotal', () => {
  const items = [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }];
  const { checkout, printable } = calculateOrder(1004, items, 'SAVE10');

  assert.deepEqual(amounts(checkout), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepEqual(amounts(printable), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepEqual(invoiceLineGst(printable), [
    { gstPercent: 5, lineTax: 104.50 }
  ]);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for all-18% items without a coupon', () => {
  const items = [
    { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
    { name: 'Syrup', price: 220, qty: 1, hsn: '2106', gstRate: 18 }
  ];
  const { checkout, printable } = calculateOrder(1008, items);
  const expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  };

  assert.deepEqual(amounts(checkout), expected);
  assert.deepEqual(amounts(printable), expected);
  assert.deepEqual(invoiceLineGst(printable), [
    { gstPercent: 18, lineTax: 50.40 },
    { gstPercent: 18, lineTax: 39.60 }
  ]);
});

test('invoice matches checkout for mixed HSN slabs and preserves recorded coupon discounts', () => {
  const items = [
    { name: 'Rice', price: 1500, qty: 1, hsn: '1006' },
    { name: 'Ghee', price: 740, qty: 1, hsn: '0405' }
  ];
  const { checkout, printable } = calculateOrder(2001, items, 'SAVE10');

  assert.deepEqual(amounts(printable), {
    subtotal: 2240, discount: 150, tax: 152.83, cgst: 76.42, sgst: 76.41, total: 2242.83
  });
  assert.deepEqual(amounts(printable), amounts(checkout));
  assert.deepEqual(invoiceLineGst(printable), [
    { gstPercent: 5, lineTax: 69.98 },
    { gstPercent: 12, lineTax: 82.85 }
  ]);

  const savedOrder = {
    id: 2002,
    items,
    coupon: 'DIWALI20',
    subtotal: 2240,
    discount: 250,
    tax: 145.52,
    total: 2135.52
  };
  const reprint = invoice.computeInvoiceFigures(savedOrder);

  assert.deepEqual(amounts(reprint), {
    subtotal: 2240, discount: 250, tax: 145.52, cgst: 72.76, sgst: 72.76, total: 2135.52
  });
  assert.deepEqual(invoiceLineGst(reprint), [
    { gstPercent: 5, lineTax: 66.63 },
    { gstPercent: 12, lineTax: 78.89 }
  ]);
});
