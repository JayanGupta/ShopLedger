const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(items, coupon = '') {
  return {
    printed: invoice.computeInvoiceFigures({ items, coupon }),
    checkout: pricing.computeTotals(items, coupon),
  };
}

function totals({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function lineTaxes(lines) {
  return lines.map(({ gstPercent, lineTax, tax }) => ({
    gstPercent,
    tax: lineTax ?? tax,
  }));
}

test('CURRENT BEHAVIOUR: #1001 invoice applies the 5% and 12% HSN slabs', () => {
  const items = [
    { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 300, qty: 1, hsn: '0405' },
  ];
  const { printed, checkout } = calculate(items);

  assert.deepEqual(totals(printed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
  });
  assert.deepEqual(lineTaxes(printed.rows), [
    { gstPercent: 5, tax: 10 },
    { gstPercent: 12, tax: 36 },
  ]);
  assert.deepEqual(totals(checkout), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
  });
  assert.deepEqual(lineTaxes(checkout.lines), [
    { gstPercent: 5, tax: 10 },
    { gstPercent: 12, tax: 36 },
  ]);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [{ name: 'Rice', price: 510, qty: 2, hsn: '1006' }];
  const { printed, checkout } = calculate(items, 'SAVE10');

  assert.deepEqual(totals(printed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
  assert.deepEqual(lineTaxes(printed.rows), [{ gstPercent: 5, tax: 45.90 }]);
  assert.deepEqual(totals(checkout), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
  });
  assert.deepEqual(lineTaxes(checkout.lines), [{ gstPercent: 5, tax: 45.90 }]);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', () => {
  const items = [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }];
  const { printed, checkout } = calculate(items, 'SAVE10');

  assert.deepEqual(totals(printed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assert.deepEqual(lineTaxes(printed.rows), [{ gstPercent: 5, tax: 104.50 }]);
  assert.deepEqual(totals(checkout), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
  });
  assert.deepEqual(lineTaxes(checkout.lines), [{ gstPercent: 5, tax: 104.50 }]);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout at 18% without a coupon', () => {
  // Cover both an explicit percentage and an HSN-only line.
  const items = [
    { name: 'Tea', price: 250, qty: 2, hsn: '0902', gstRate: 18 },
    { name: 'Coffee', price: 100, qty: 1, hsn: '0901' },
  ];
  const { printed, checkout } = calculate(items);

  assert.deepEqual(totals(printed), {
    subtotal: 600, discount: 0, tax: 108, cgst: 54, sgst: 54, total: 708,
  });
  assert.deepEqual(lineTaxes(printed.rows), [
    { gstPercent: 18, tax: 90 },
    { gstPercent: 18, tax: 18 },
  ]);
  assert.deepEqual(totals(checkout), totals(printed));
  assert.deepEqual(lineTaxes(checkout.lines), lineTaxes(printed.rows));
});

test('invoice matches checkout for capped SAVE10 across mixed HSN slabs', () => {
  const items = [
    { name: 'Rice', price: 620, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 1000, qty: 1, hsn: '0405' },
  ];
  const { printed, checkout } = calculate(items, 'SAVE10');

  assert.equal(checkout.discount, 150);
  assert.deepEqual(totals(printed), totals(checkout));
  assert.deepEqual(lineTaxes(printed.rows), [
    { gstPercent: 5, tax: 57.85 },
    { gstPercent: 12, tax: 111.96 },
  ]);

  const historical = invoice.computeInvoiceFigures({
    items,
    coupon: 'DIWALI20',
    discount: 150,
  });
  assert.deepEqual(totals(historical), totals(checkout));
  assert.deepEqual(lineTaxes(historical.rows), lineTaxes(printed.rows));
});
