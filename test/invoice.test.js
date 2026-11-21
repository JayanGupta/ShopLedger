const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function summarize(figures, lines, taxField) {
  const { subtotal, discount, tax, cgst, sgst, total } = figures;
  return {
    subtotal,
    discount,
    tax,
    cgst,
    sgst,
    total,
    lineGst: lines.map((line) => ({
      percent: line.gstPercent,
      amount: line[taxField]
    }))
  };
}

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(summarize(printed, printed.rows, 'lineTax'), expectedInvoice, 'invoice');
  assert.deepStrictEqual(summarize(billed, billed.lines, 'tax'), expectedCheckout, 'checkout');
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the checkout HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    // HSN-only order lines have no persisted GST rate.
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  };

  const expected = {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
    lineGst: [{ percent: 5, amount: 32 }, { percent: 12, amount: 54 }]
  };

  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined }]
  };

  const expected = {
    subtotal: 640, discount: 64, tax: 28.8, cgst: 14.4, sgst: 14.4, total: 604.8,
    lineGst: [{ percent: 5, amount: 28.8 }]
  };

  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap on a 2240 subtotal', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    // An explicit percentage makes both paths use the same GST rate.
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }]
  };

  const expected = {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    lineGst: [{ percent: 5, amount: 104.5 }]
  };

  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree at 18% GST without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 200, qty: 2, hsn: '0902', gstRate: undefined },
      { name: 'Coffee', price: 100, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  const expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lineGst: [{ percent: 18, amount: 72 }, { percent: 18, amount: 18 }]
  };

  assertFigures(order, expected, expected);
});

test('invoice matches capped mixed-slab checkout and recorded flat-rate legacy checkout', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 480, qty: 2, hsn: '0405' }
    ]
  };
  const expected = {
    subtotal: 2240, discount: 150, tax: 167.2, cgst: 83.6, sgst: 83.6, total: 2257.2,
    lineGst: [{ percent: 5, amount: 59.71 }, { percent: 12, amount: 107.49 }]
  };

  assertFigures(order, expected, expected);

  const legacyOrder = {
    coupon: '',
    items: [{ name: 'Rice', price: 640, qty: 1, hsn: '1006' }],
    subtotal: 640, discount: 0, tax: 115.2, total: 755.2
  };
  const legacyInvoice = invoice.computeInvoiceFigures(legacyOrder);
  assert.deepStrictEqual(summarize(legacyInvoice, legacyInvoice.rows, 'lineTax'), {
    subtotal: 640, discount: 0, tax: 115.2, cgst: 57.6, sgst: 57.6, total: 755.2,
    lineGst: [{ percent: 18, amount: 115.2 }]
  });
});
