const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('#1001-style invoice uses the 5% and 12% HSN slabs', () => {
  // Newly created order lines carry HSN but omit gstRate.
  const items = [
    { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 300, qty: 1, hsn: '0405' },
  ];
  const coupon = '';

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  const billed = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 10 },
    { gstPercent: 12, lineTax: 36 },
  ]);
  assert.deepEqual(figures(billed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
  });
  assert.deepEqual(billed.lines.map(({ gstPercent }) => gstPercent), [5, 12]);
});

test('#1002-style SAVE10 invoice applies the discount before GST', () => {
  const items = [{ name: 'Tea', price: 500, qty: 2, hsn: '0902', gstRate: 18 }];
  const coupon = 'SAVE10';

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  const billed = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062,
  });
  assert.equal(printed.rows[0].lineTax, 162);
  assert.deepEqual(figures(billed), {
    subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062,
  });
});

test('#1004-style SAVE10 invoice honors the ₹150 discount cap', () => {
  const items = [{ name: 'Coffee', price: 560, qty: 4, hsn: '0901' }];
  const coupon = 'SAVE10';

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  const billed = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
  });
  assert.equal(printed.rows[0].lineTax, 376.2);
  assert.deepEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
  });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for all 18% items without a coupon', () => {
  const items = [
    { name: 'Tea', price: 100, qty: 1, hsn: '0902', gstRate: 18 },
    { name: 'Coffee', price: 75, qty: 2, hsn: '0901' },
  ];
  const coupon = '';

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  const billed = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 250, discount: 0, tax: 45, cgst: 22.5, sgst: 22.5, total: 295,
  });
  assert.deepEqual(printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 18, lineTax: 18 },
    { gstPercent: 18, lineTax: 27 },
  ]);
  assert.deepEqual(figures(billed), figures(printed));
});

test('invoice matches checkout line GST and totals for a capped SAVE10 basket', () => {
  const items = [
    { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 480, qty: 2, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon });

  assert.equal(billed.discount, 150);
  assert.deepEqual(figures(printed), figures(billed));
  assert.deepEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    billed.lines.map(({ gstPercent, tax }) => ({ gstPercent, lineTax: tax })),
  );
});
