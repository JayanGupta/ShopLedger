const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function compare(order, expectedInvoice, expectedCheckout) {
  const { items, coupon } = order;
  const { rows, ...invoiceAmounts } = invoice.computeInvoiceFigures(order);
  const { subtotal, discount, tax, cgst, sgst, total, lines } =
    pricing.computeTotals(items, coupon);

  assert.deepStrictEqual(
    { ...invoiceAmounts, lineGst: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]) },
    expectedInvoice
  );
  assert.deepStrictEqual(
    { subtotal, discount, tax, cgst, sgst, total, lineGst: lines.map(({ gstPercent, tax }) => [gstPercent, tax]) },
    expectedCheckout
  );
}

// An undefined gstRate models a checkout snapshot with no rate override.
test('#1001 invoice matches checkout for 5% and 12% HSN items', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  };

  const expected = {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    lineGst: [[5, 10], [12, 36]]
  };

  compare(order, expected, expected);
});

test('#1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: undefined }]
  };

  const expected = {
    subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20,
    lineGst: [[18, 97.20]]
  };

  compare(order, expected, expected);
});

test('#1004 invoice applies the SAVE10 cap on ₹2,240', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Coffee', price: 1120, qty: 2, hsn: '0901', gstRate: undefined }]
  };

  const expected = {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20,
    lineGst: [[18, 376.20]]
  };

  compare(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 all-18% order without a coupon matches checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: undefined },
      { name: 'Coffee', price: 300, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  const expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lineGst: [[18, 36], [18, 54]]
  };

  compare(order, expected, expected);
});

test('invoice matches the billed HSN GST and capped SAVE10 discount for #1004', () => {
  const items = [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  const order = { id: 1004, items, coupon, ...billed };
  const figures = invoice.computeInvoiceFigures(order);
  const reprinted = invoice.computeInvoiceFigures({
    ...order,
    coupon: 'RETIRED_SAVE10'
  });

  assert.deepStrictEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total,
      lineGst: figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax])
    },
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.50,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.50,
      lineGst: [[5, 104.50]]
    }
  );
  assert.deepStrictEqual(reprinted, figures);
});
