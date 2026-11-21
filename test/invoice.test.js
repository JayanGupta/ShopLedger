'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertOrderFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceAmounts } = invoice.computeInvoiceFigures(order);
  const { lines, taxable, ...checkoutAmounts } = pricing.computeTotals(order.items, order.coupon);

  const { lineGst: invoiceLineGst, ...expectedInvoiceAmounts } = expectedInvoice;
  const { lineGst: checkoutLineGst, taxable: expectedTaxable, ...expectedCheckoutAmounts } = expectedCheckout;

  assert.deepEqual(invoiceAmounts, expectedInvoiceAmounts, 'invoice amounts');
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), invoiceLineGst, 'invoice [GST %, tax] per line');
  assert.deepEqual(checkoutAmounts, expectedCheckoutAmounts, 'checkout amounts');
  assert.equal(taxable, expectedTaxable, 'checkout taxable subtotal');
  assert.deepEqual(lines.map(({ gstPercent, tax }) => [gstPercent, tax]), checkoutLineGst, 'checkout [GST %, tax] per line');
}

test('#1001 invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    // HSN-only lines model the order route, which does not save gstRate.
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 300, qty: 1 },
    ],
  };

  assertOrderFigures(order, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    lineGst: [[5, 10], [12, 36]],
  }, {
    subtotal: 500, discount: 0, taxable: 500, tax: 46, cgst: 23, sgst: 23, total: 546,
    lineGst: [[5, 10], [12, 36]],
  });
});

test('#1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 3, name: 'Tea', hsn: '0902', gstRate: 18, price: 300, qty: 2 },
    ],
  };

  assertOrderFigures(order, {
    subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20,
    lineGst: [[18, 97.20]],
  }, {
    subtotal: 600, discount: 60, taxable: 540, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20,
    lineGst: [[18, 97.20]],
  });
});

test('#1004 invoice applies the SAVE10 cap on a 2,240 subtotal', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 4, name: 'Coffee', hsn: '0901', price: 560, qty: 4 },
    ],
  };

  assertOrderFigures(order, {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20,
    lineGst: [[18, 376.20]],
  }, {
    subtotal: 2240, discount: 150, taxable: 2090, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20,
    lineGst: [[18, 376.20]],
  });
});

test('#1008 invoice agrees with checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', hsn: '0902', price: 250, qty: 2 },
      { id: 4, name: 'Coffee', hsn: '0901', gstRate: 18, price: 200, qty: 1 },
    ],
  };

  assertOrderFigures(order, {
    subtotal: 700, discount: 0, tax: 126, cgst: 63, sgst: 63, total: 826,
    lineGst: [[18, 90], [18, 36]],
  }, {
    subtotal: 700, discount: 0, taxable: 700, tax: 126, cgst: 63, sgst: 63, total: 826,
    lineGst: [[18, 90], [18, 36]],
  });
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 120, qty: 10 },
      { id: 2, name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 520, qty: 2 },
    ],
  };

  assertOrderFigures(order, {
    subtotal: 2240, discount: 150, tax: 172.42, cgst: 86.21, sgst: 86.21, total: 2262.42,
    lineGst: [[5, 55.98], [12, 116.44]],
  }, {
    subtotal: 2240, discount: 150, taxable: 2090, tax: 172.42, cgst: 86.21, sgst: 86.21, total: 2262.42,
    lineGst: [[5, 55.98], [12, 116.44]],
  });
});
