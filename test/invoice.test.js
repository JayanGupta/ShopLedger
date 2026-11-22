const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// An unset gstRate exercises the HSN lookup.
function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function checkOrder(order, expectedCheckout, expectedInvoice, expectedInvoiceRows) {
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);
  assert.deepStrictEqual(amounts(billed), expectedCheckout, 'checkout amounts');
  assert.deepStrictEqual(amounts(printed), expectedInvoice, 'invoice amounts');
  assert.deepStrictEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    expectedInvoiceRows,
    'invoice GST by line'
  );
}

test('#1001 prints the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001, coupon: '',
    items: [item('Rice', 100, 2, '1006'), item('Ghee', 450, 1, '0405')]
  };
  const expected = { subtotal: 650, discount: 0, tax: 64, cgst: 32, sgst: 32, total: 714 };
  checkOrder(order, expected, expected,
    [{ gstPercent: 5, lineTax: 10 }, { gstPercent: 12, lineTax: 54 }]
  );
});

test('#1002 applies SAVE10 before invoice GST', () => {
  const order = {
    id: 1002, coupon: 'SAVE10',
    items: [item('Rice', 640, 1, '1006'), item('Sunflower oil', 190, 2, '1512')]
  };
  const expected = { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 };
  checkOrder(order, expected, expected,
    [{ gstPercent: 5, lineTax: 28.80 }, { gstPercent: 5, lineTax: 17.10 }]
  );
});

test('#1004 caps SAVE10 at ₹150 on the invoice', () => {
  const order = {
    id: 1004, coupon: 'SAVE10',
    items: [item('Groundnut oil', 1120, 2, '1508')]
  };
  const expected = { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 };
  checkOrder(order, expected, expected,
    [{ gstPercent: 5, lineTax: 104.50 }]
  );
});

test('CURRENT BEHAVIOUR: #1008 agrees at 18% with no coupon', () => {
  const order = {
    id: 1008, coupon: '',
    items: [item('Tea', 140, 1, '0902', 18), item('Syrup', 180, 2, '2106')]
  };
  const expected = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  checkOrder(order, expected, expected,
    [{ gstPercent: 18, lineTax: 25.20 }, { gstPercent: 18, lineTax: 64.80 }]
  );
});

test('invoice matches checkout when capped SAVE10 spans two GST slabs', () => {
  const order = {
    coupon: 'SAVE10',
    items: [item('Rice', 500, 2, '1006'), item('Ghee', 1000, 1, '0405')]
  };
  // Each ₹1,000 line gets ₹75 off. GST is calculated on ₹925 per line.
  const expected = { subtotal: 2000, discount: 150, tax: 157.25, cgst: 78.63, sgst: 78.62, total: 2007.25 };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);
  assert.deepStrictEqual(amounts(billed), expected);
  assert.deepStrictEqual(amounts(printed), expected);
  assert.deepStrictEqual(printed.rows.map(({ line, gstPercent, lineTax }) => ({ line, gstPercent, lineTax })), [
    { line: 1000, gstPercent: 5, lineTax: 46.25 },
    { line: 1000, gstPercent: 12, lineTax: 111 }
  ]);
});
