const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculateFigures(id, items, coupon) {
  const checkout = pricing.computeTotals(items, coupon);
  const { subtotal, discount, tax, total } = checkout;
  const order = { id, items, coupon, subtotal, discount, tax, total };
  return { checkout, printed: invoice.computeInvoiceFigures(order) };
}

test('CURRENT BEHAVIOUR: invoice retains the saved capped discount for mixed GST slabs', () => {
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 560, qty: 2 },
    { id: 2, name: 'Ghee', hsn: '0405', price: 560, qty: 2 },
  ];
  const { checkout, printed } = calculateFigures(2001, items, 'SAVE10');

  assert.equal(checkout.discount, 150);
  assert.deepEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 5, lineTax: 52.25 }, { gstPercent: 12, lineTax: 125.4 }],
  );
  const { subtotal, discount, tax, cgst, sgst, total } = printed;
  assert.deepEqual(
    { subtotal, discount, tax, cgst, sgst, total },
    { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 },
  );
  assert.equal(total, checkout.total);

  const reprinted = invoice.computeInvoiceFigures({
    items, coupon: 'DIWALI20', subtotal, discount, tax, total,
  });
  assert.deepEqual(reprinted, printed);
});

test('CURRENT BEHAVIOUR: #1001 invoice uses the checkout HSN slabs', () => {
  // Model saved checkout lines with HSN but without a gstRate override.
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 },
    { id: 2, name: 'Ghee', hsn: '0405', price: 300, qty: 1 },
  ];
  const { checkout, printed } = calculateFigures(1001, items, '');

  assert.deepEqual(checkout.lines.map(line => line.gstPercent), [5, 12]);
  assert.equal(checkout.tax, 46);
  assert.equal(checkout.total, 546);
  assert.deepEqual(printed, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 100, gstPercent: 5, line: 200, lineTax: 10 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 300, gstPercent: 12, line: 300, lineTax: 36 },
    ],
  });
});

test('CURRENT BEHAVIOUR: #1001-style reprint can show row GST that differs from saved GST', () => {
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 },
    { id: 2, name: 'Ghee', hsn: '0405', price: 300, qty: 1 },
  ];
  const coupon = '';
  const checkout = pricing.computeTotals(items, coupon);
  // Simulate an older bill that used 18% GST on the whole subtotal.
  const printed = invoice.computeInvoiceFigures({
    id: 1001, items, coupon, subtotal: 500, discount: 0, tax: 90, total: 590,
  });

  assert.equal(checkout.tax, 46);
  assert.equal(checkout.total, 546);
  const { rows, ...summary } = printed;
  assert.deepEqual(summary, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  });
  assert.deepEqual(
    rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 5, lineTax: 10 }, { gstPercent: 12, lineTax: 36 }],
  );
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [{ id: 1, name: 'Rice', hsn: '1006', price: 300, qty: 2 }];
  const { checkout, printed } = calculateFigures(1002, items, 'SAVE10');

  assert.equal(checkout.discount, 60);
  assert.equal(checkout.tax, 27);
  assert.equal(checkout.total, 567);
  assert.deepEqual(printed, {
    subtotal: 600, discount: 60, tax: 27, cgst: 13.5, sgst: 13.5, total: 567,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 300, gstPercent: 5, line: 600, lineTax: 27 },
    ],
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', () => {
  const items = [{ id: 3, name: 'Tea', hsn: '0902', price: 560, qty: 4 }];
  const { checkout, printed } = calculateFigures(1004, items, 'SAVE10');

  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
  assert.deepEqual(printed, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 4, price: 560, gstPercent: 18, line: 2240, lineTax: 376.2 },
    ],
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const items = [
    { id: 3, name: 'Tea', hsn: '0902', price: 100, qty: 2 },
    { id: 4, name: 'Coffee', hsn: '0901', gstRate: 18, price: 150, qty: 1 },
  ];
  const { checkout, printed } = calculateFigures(1008, items, '');

  const { subtotal, discount, tax, cgst, sgst, total, rows } = printed;
  const expected = { subtotal: 350, discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413 };
  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, expected);
  for (const field of Object.keys(expected)) {
    assert.equal(checkout[field], printed[field], field);
  }
  assert.deepEqual(rows, [
    { name: 'Tea', sku: '-', hsn: '0902', qty: 2, price: 100, gstPercent: 18, line: 200, lineTax: 36 },
    { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 150, gstPercent: 18, line: 150, lineTax: 27 },
  ]);
});
