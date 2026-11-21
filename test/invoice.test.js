const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const mixedSlabs = {
  id: 1001,
  items: [
    { name: 'Rice', sku: 'RICE', price: 90, qty: 1, hsn: '1006' },
    { name: 'Ghee', sku: 'GHEE', price: 520, qty: 1, hsn: '0405' }
  ]
};
const save10 = {
  id: 1002,
  coupon: 'SAVE10',
  items: [{ name: 'Rice', sku: 'RICE', price: 510, qty: 2, hsn: '1006' }]
};
const cappedSave10 = {
  id: 1004,
  coupon: 'SAVE10',
  items: [{ name: 'Groundnut oil', sku: 'OIL', price: 560, qty: 4, hsn: '1508' }]
};
const defaultSlab = {
  id: 1008,
  items: [{ name: 'Tea', sku: 'TEA', price: 500, qty: 1, hsn: '0902', gstRate: 18 }]
};

function amounts({ subtotal, discount, tax, total }) {
  return { subtotal, discount, tax, total };
}

test('#1001 preserves individual 5% and 12% HSN rates', () => {
  const printed = invoice.computeInvoiceFigures(mixedSlabs);
  const checkout = pricing.computeTotals(mixedSlabs.items, mixedSlabs.coupon);
  assert.deepEqual(amounts(printed), { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 });
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5, 12]);
  assert.deepEqual(amounts(checkout), { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 });
});

test('#1002 applies SAVE10 before GST', () => {
  const printed = invoice.computeInvoiceFigures(save10);
  const checkout = pricing.computeTotals(save10.items, save10.coupon);
  assert.deepEqual(amounts(printed), { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
  assert.deepEqual(amounts(checkout), { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
});

test('#1004 respects the SAVE10 cap on a ₹2,240 subtotal', () => {
  const printed = invoice.computeInvoiceFigures(cappedSave10);
  const checkout = pricing.computeTotals(cappedSave10.items, cappedSave10.coupon);
  assert.deepEqual(amounts(printed), { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
  assert.deepEqual(amounts(checkout), { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
});

test('#1008 invoice and checkout agree for an 18% item without a coupon', () => {
  const printed = invoice.computeInvoiceFigures(defaultSlab);
  const checkout = pricing.computeTotals(defaultSlab.items, defaultSlab.coupon);
  const expected = { subtotal: 500, discount: 0, tax: 90, total: 590 };
  assert.deepEqual(amounts(printed), expected);
  assert.deepEqual(amounts(checkout), expected);
});

test('#1004 printable figures match the capped checkout and line GST', () => {
  const printed = invoice.computeInvoiceFigures(cappedSave10);
  assert.deepEqual(amounts(printed), { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
  assert.equal(printed.cgst, 52.25);
  assert.equal(printed.sgst, 52.25);
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.rows[0].lineTax, 104.5);
});
