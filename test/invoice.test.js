const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These fixtures model order shapes. Checkout snapshots carry HSN but omit gstRate.
function figures(items, coupon) {
  const billed = pricing.computeTotals(items, coupon);
  const { rows, ...printed } = invoice.computeInvoiceFigures({ items, coupon });
  return {
    billed: {
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total
    },
    printed,
    billedRates: billed.lines.map(line => line.gstPercent),
    printedGst: rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }))
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses 5% and 12% HSN slabs', () => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 100, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 300, qty: 1 }
  ];

  assert.deepEqual(figures(items, ''), {
    billed: { discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    printed: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    billedRates: [5, 12],
    printedGst: [{ gstPercent: 5, lineTax: 10 }, { gstPercent: 12, lineTax: 36 }]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [{ name: 'Tea', hsn: '0902', price: 500, qty: 2 }];

  assert.deepEqual(figures(items, 'SAVE10'), {
    billed: { discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    printed: { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    billedRates: [18],
    printedGst: [{ gstPercent: 18, lineTax: 162 }]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice caps SAVE10 at ₹150 on ₹2,240', () => {
  const items = [{ name: 'Coffee', hsn: '0901', price: 560, qty: 4 }];

  assert.deepEqual(figures(items, 'SAVE10'), {
    billed: { discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    printed: { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    billedRates: [18],
    printedGst: [{ gstPercent: 18, lineTax: 376.2 }]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice agrees with checkout at 18% without a coupon', () => {
  const items = [
    { name: 'Tea', hsn: '0902', price: 125, qty: 2 },
    { name: 'Coffee', hsn: '0901', gstRate: 18, price: 100, qty: 1 }
  ];

  assert.deepEqual(figures(items, ''), {
    billed: { discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413 },
    printed: { subtotal: 350, discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413 },
    billedRates: [18, 18],
    printedGst: [{ gstPercent: 18, lineTax: 45 }, { gstPercent: 18, lineTax: 18 }]
  });
});

test('invoice matches checkout GST slabs, capped discount, and total', () => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 500, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 620, qty: 2 }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const { rows, ...totals } = invoice.computeInvoiceFigures({ items, coupon });

  assert.deepEqual({
    ...totals,
    lineGst: rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }))
  }, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    lineGst: checkout.lines.map(({ gstPercent, tax }) => ({ gstPercent, lineTax: tax }))
  });
});
