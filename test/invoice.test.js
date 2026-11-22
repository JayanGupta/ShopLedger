const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const config = require('../config');

function compareFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { subtotal, discount, tax, cgst, sgst, total, lines } =
    pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual({
    ...invoiceTotals,
    lines: rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax }))
  }, expectedInvoice, 'invoice figures');

  assert.deepStrictEqual({
    subtotal, discount, tax, cgst, sgst, total,
    lines: lines.map(({ gstPercent, tax }) => ({ gstPercent, tax }))
  }, expectedCheckout, 'checkout figures');
}

// Model checkout's saved lines: price, qty and hsn are present, but gstRate is absent.
test('#1001 invoices the 5% and 12% checkout slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 250, qty: 2 }
    ]
  };

  const expected = {
    subtotal: 1140, discount: 0, tax: 92, cgst: 46, sgst: 46, total: 1232,
    lines: [{ gstPercent: 5, tax: 32 }, { gstPercent: 12, tax: 60 }]
  };

  compareFigures(order, expected, expected);
});

test('#1002 applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { id: 4, name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ]
  };

  const expected = {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    lines: [{ gstPercent: 5, tax: 28.80 }, { gstPercent: 5, tax: 17.10 }]
  };

  compareFigures(order, expected, expected);
});

test('#1004 invoice applies the ₹150 SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ id: 1, name: 'Rice', hsn: '1006', price: 320, qty: 7 }]
  };

  const expected = {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
    lines: [{ gstPercent: 5, tax: 104.50 }]
  };

  compareFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 all-18% order without a coupon matches checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 5, name: 'Tea', hsn: '0902', price: 300, qty: 2 },
      { id: 6, name: 'Coffee', hsn: '0901', price: 250, qty: 1 }
    ]
  };
  const expected = {
    subtotal: 850, discount: 0, tax: 153, cgst: 76.50, sgst: 76.50, total: 1003,
    lines: [{ gstPercent: 18, tax: 108 }, { gstPercent: 18, tax: 45 }]
  };

  compareFigures(order, expected, expected);
});

test('invoice matches billed GST and a capped coupon across mixed HSN slabs', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 1000, qty: 1 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 500, qty: 2 }
    ]
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const savedOrder = { ...order, ...billed };
  const figures = invoice.computeInvoiceFigures(savedOrder);

  assert.deepStrictEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    lines: figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax])
  }, {
    subtotal: 2000,
    discount: 150,
    tax: 157.25,
    cgst: 78.63,
    sgst: 78.62,
    total: 2007.25,
    lines: [[5, 46.25], [12, 111]]
  });

  const coupon = config.coupons.SAVE10;
  const wasActive = coupon.active;
  coupon.active = false;
  try {
    assert.deepStrictEqual(invoice.computeInvoiceFigures(savedOrder), figures);
  } finally {
    coupon.active = wasActive;
  }
});
