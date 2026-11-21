const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function compareFigures(items, coupon) {
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon });
  return { checkout, printed };
}

function totals({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('#1001 uses the 5% and 12% HSN rates on the invoice', () => {
  // Omit gstRate to exercise the HSN lookup.
  const items = [
    { id: 1, name: 'Dal', price: 165, qty: 2, hsn: '0713' },
    { id: 2, name: 'Butter', price: 140, qty: 2, hsn: '0405' },
  ];
  const { checkout, printed } = compareFigures(items, '');

  assert.deepEqual(totals(printed), {
    subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1,
  });
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5, 12]);
  assert.deepEqual(printed.rows.map(row => row.lineTax), [16.5, 33.6]);
  assert.deepEqual(checkout.lines.map(line => line.gstPercent), [5, 12]);
  assert.deepEqual(totals(checkout), {
    subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1,
  });
});

test('#1002 applies SAVE10 before GST on the invoice', () => {
  const items = [
    { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' },
    { id: 2, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' },
  ];
  const { checkout, printed } = compareFigures(items, 'SAVE10');

  assert.deepEqual(totals(printed), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
  });
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5, 5]);
  assert.deepEqual(printed.rows.map(row => row.lineTax), [28.8, 17.1]);
  assert.deepEqual(totals(checkout), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
  });
});

test('#1004 honors the ₹150 SAVE10 cap on the invoice', () => {
  const items = [
    { id: 1, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' },
  ];
  const { checkout, printed } = compareFigures(items, 'SAVE10');

  assert.deepEqual(totals(printed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
  });
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5]);
  assert.deepEqual(printed.rows.map(row => row.lineTax), [104.5]);
  assert.deepEqual(totals(checkout), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
  });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% lines without a coupon', () => {
  const items = [
    { id: 1, name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
    { id: 2, name: 'Sherbet', price: 180, qty: 2, hsn: '2106' },
  ];
  const { checkout, printed } = compareFigures(items, '');

  assert.deepEqual(totals(printed), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  });
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [18, 18]);
  assert.deepEqual(printed.rows.map(row => row.lineTax), [25.2, 64.8]);
  assert.deepEqual(totals(checkout), totals(printed));
});

test('invoice matches checkout for mixed GST slabs and a capped SAVE10 discount', () => {
  const items = [
    { id: 1, name: 'Rice', price: 500, qty: 2, hsn: '1006' },
    { id: 2, name: 'Butter', price: 620, qty: 2, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { id: 1, items, coupon, ...totals(checkout) };
  const printed = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.deepEqual(totals(printed), totals(checkout));
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5, 12]);
  assert.deepEqual(printed.rows.map(row => row.lineTax), [46.65, 138.84]);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
