const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(id, items, coupon) {
  return {
    printed: invoice.computeInvoiceFigures({ id, items, coupon }),
    billed: pricing.computeTotals(items, coupon)
  };
}

function figures({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('#1001 prints the 5% and 12% HSN slabs', () => {
  // Persisted checkout items carry HSN but omit gstRate.
  const { printed, billed } = calculate(1001, [
    { price: 50, qty: 2, hsn: '1006' },
    { price: 100, qty: 1, hsn: '0405' }
  ], '');
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 5], [12, 12]]);
  assert.deepEqual(billed.lines.map(row => [row.gstPercent, row.tax]), [[5, 5], [12, 12]]);
  assert.deepEqual(figures(printed), { subtotal: 200, discount: 0, tax: 17, cgst: 8.5, sgst: 8.5, total: 217 });
  assert.equal(billed.total, 217);
});

test('#1002 applies SAVE10 before GST', () => {
  const { printed, billed } = calculate(1002, [{ price: 250, qty: 2, hsn: '0902', gstRate: 18 }], 'SAVE10');
  assert.deepEqual(figures(printed), figures(billed));
  assert.deepEqual(figures(billed), { subtotal: 500, discount: 50, tax: 81, cgst: 40.5, sgst: 40.5, total: 531 });
});

test('#1004 honors the SAVE10 cap', () => {
  const { printed, billed } = calculate(1004, [{ price: 560, qty: 4, hsn: '0902' }], 'SAVE10');
  assert.deepEqual(figures(printed), figures(billed));
  assert.deepEqual(figures(billed), { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 });
});

test('#1008 agrees at 18% without a coupon', () => {
  const { printed, billed } = calculate(1008, [
    { price: 50, qty: 2, hsn: '0902' },
    { price: 100, qty: 2, hsn: '0901' }
  ], '');
  assert.deepEqual(figures(printed), { subtotal: 300, discount: 0, tax: 54, cgst: 27, sgst: 27, total: 354 });
  assert.deepEqual(figures(printed), figures(billed));
});

test('mixed HSN invoice matches checkout after capped SAVE10', () => {
  const { printed, billed } = calculate(1010, [
    { price: 1000, qty: 1, hsn: '1006' },
    { price: 500, qty: 2, hsn: '0405' }
  ], 'SAVE10');
  assert.deepEqual(figures(printed), figures(billed));
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 46.25], [12, 111]]);
});
