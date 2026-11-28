const test = require('node:test');
const assert = require('node:assert').strict;
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Stored checkout lines have an HSN but no explicit gstRate.
function item(hsn, price, qty, gstRate) {
  return { hsn, price, qty, gstRate };
}

function check(order, expectedInvoice, expectedCheckout, expectedRows) {
  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);
  function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
    return { subtotal, discount, tax, cgst, sgst, total };
  }
  assert.deepEqual(amounts(printed), expectedInvoice);
  assert.deepEqual(amounts(billed), expectedCheckout);
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), expectedRows);
}

test('#1001 prints each HSN slab', () => {
  check({ items: [item('1006', 100, 2), item('0405', 100, 1)], coupon: '' },
    { subtotal: 300, discount: 0, tax: 22, cgst: 11, sgst: 11, total: 322 },
    { subtotal: 300, discount: 0, tax: 22, cgst: 11, sgst: 11, total: 322 },
    [[5, 10], [12, 12]]);
});

test('#1002 applies SAVE10 before GST', () => {
  check({ items: [item('1006', 640, 1), item('1512', 190, 2)], coupon: 'SAVE10' },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    [[5, 28.8], [5, 17.1]]);
});

test('#1004 respects the SAVE10 cap', () => {
  check({ items: [item('1508', 1120, 2)], coupon: 'SAVE10' },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    [[5, 104.5]]);
});

test('CURRENT BEHAVIOUR: #1008 matches checkout at 18% without a coupon', () => {
  const expected = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  check({ items: [item('0902', 140, 1), item('2106', 180, 2)], coupon: '' },
    expected, expected, [[18, 25.2], [18, 64.8]]);
});

test('invoice allocates capped SAVE10 across mixed GST slabs before tax', () => {
  const expected = { subtotal: 3000, discount: 150, tax: 209, cgst: 104.5, sgst: 104.5, total: 3059 };
  check({ items: [item('1006', 1000, 2), item('0405', 1000, 1)], coupon: 'SAVE10' },
    expected, expected, [[5, 95], [12, 114]]);
});
