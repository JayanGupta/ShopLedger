const test = require('node:test');
const assert = require('node:assert/strict');
const coupons = require('../lib/coupons');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function assertFigures(order, expectedInvoice, expectedBilled = expectedInvoice) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    ...amounts(invoiceFigures),
    lineGst: invoiceFigures.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax }))
  }, expectedInvoice, 'invoice figures');

  assert.deepEqual({
    ...amounts(billedFigures),
    lineGst: billedFigures.lines.map(({ gstPercent, tax }) => ({ gstPercent, tax }))
  }, expectedBilled, 'billed figures');
}

test('CURRENT BEHAVIOUR: #1001 matches billing with 5% and 12% GST and no coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 89, qty: 2, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 425, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };

  assertFigures(order, {
    subtotal: 603, discount: 0, tax: 59.90, cgst: 29.95, sgst: 29.95, total: 662.90,
    lineGst: [{ gstPercent: 5, tax: 8.90 }, { gstPercent: 12, tax: 51 }]
  });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST and matches billing', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Dal', price: 80, qty: 4, hsn: '0713', gstRate: 5 },
      { name: 'Ghee', price: 430, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };

  assertFigures(order, {
    subtotal: 750, discount: 75, tax: 60.84, cgst: 30.42, sgst: 30.42, total: 735.84,
    lineGst: [{ gstPercent: 5, tax: 14.40 }, { gstPercent: 12, tax: 46.44 }]
  });
});

test('CURRENT BEHAVIOUR: #1004 caps SAVE10 at ₹150 and matches billing', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 320, qty: 3, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 640, qty: 2, hsn: '0405', gstRate: 12 }
    ]
  };

  assertFigures(order, {
    subtotal: 2240, discount: 150, tax: 188.10, cgst: 94.05, sgst: 94.05, total: 2278.10,
    lineGst: [{ gstPercent: 5, tax: 44.79 }, { gstPercent: 12, tax: 143.31 }]
  });
});

test('CURRENT BEHAVIOUR: #1008 matches billing with all items at 18% GST and no coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 175, qty: 2, hsn: '0902', gstRate: 18 },
      { name: 'Coffee', price: 295, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  assertFigures(order, {
    subtotal: 645, discount: 0, tax: 116.10, cgst: 58.05, sgst: 58.05, total: 761.10,
    lineGst: [{ gstPercent: 18, tax: 63 }, { gstPercent: 18, tax: 53.10 }]
  });
});

test('invoice matches checkout for mixed HSN slabs with SAVE10 capped before GST', (t) => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 320, qty: 3, hsn: '1006' },
      { name: 'Ghee', price: 640, qty: 2, hsn: '0405' }
    ]
  };

  assertFigures(order, {
    subtotal: 2240, discount: 150, tax: 188.10, cgst: 94.05, sgst: 94.05, total: 2278.10,
    lineGst: [{ gstPercent: 5, tax: 44.79 }, { gstPercent: 12, tax: 143.31 }]
  });

  const recordedOrder = { ...order, ...amounts(pricing.computeTotals(order.items, order.coupon)) };
  const originalInvoice = invoice.computeInvoiceFigures(recordedOrder);
  t.mock.method(coupons, 'getCoupon', () => null);

  assert.deepEqual(invoice.computeInvoiceFigures(recordedOrder), originalInvoice, 'invoice after coupon expiry');
});
