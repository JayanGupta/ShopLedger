const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const config = require('../config');

// The order route copies HSN into saved lines but does not supply gstRate.
// Keep that field explicitly undefined to pin the invoice fallback path.
function line(id, name, sku, hsn, price, qty) {
  return { id, name, sku, hsn, price, qty, gstRate: undefined };
}

function figures(id, items, coupon) {
  const order = { id, items, coupon };
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the billed 5% and 12% HSN slabs', () => {
  const items = [
    line(1, 'Rice', 'GRN-001', '1006', 640, 1),
    line(6, 'Ghee', 'DRY-001', '0405', 450, 1)
  ];
  const result = figures(1001, items, '');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepStrictEqual(result.checkout.lines.map((row) => row.gstPercent), [5, 12]);
  assert.equal(result.checkout.tax, 86);
  assert.equal(result.checkout.total, 1176);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 is applied before HSN GST', () => {
  const items = [
    line(1, 'Rice', 'GRN-001', '1006', 640, 1),
    line(8, 'Tea', 'BEV-001', '0902', 140, 1)
  ];
  const result = figures(1002, items, 'SAVE10');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 780,
    discount: 78,
    tax: 51.48,
    cgst: 25.74,
    sgst: 25.74,
    total: 753.48,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 22.68 }
    ]
  });
  assert.equal(result.checkout.discount, 78);
  assert.equal(result.checkout.tax, 51.48);
  assert.equal(result.checkout.total, 753.48);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the ₹150 cap before GST', () => {
  const items = [
    line(5, 'Groundnut oil', 'OIL-002', '1508', 1120, 2)
  ];
  const result = figures(1004, items, 'SAVE10');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(result.checkout.discount, 150);
  assert.equal(result.checkout.tax, 104.5);
  assert.equal(result.checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 all 18% without coupon matches checkout', () => {
  const items = [
    line(8, 'Tea', 'BEV-001', '0902', 140, 1),
    line(9, 'Coffee', 'BEV-002', '0901', 260, 1)
  ];
  const result = figures(1008, items, '');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 400,
    discount: 0,
    tax: 72,
    cgst: 36,
    sgst: 36,
    total: 472,
    rows: [
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Coffee', sku: 'BEV-002', hsn: '0901', qty: 1, price: 260, gstPercent: 18, line: 260, lineTax: 46.8 }
    ]
  });
  assert.deepStrictEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 400, discount: 0, tax: 72, total: 472 }
  );
});

test('invoice matches checkout HSN GST and capped pre-tax SAVE10 discount', () => {
  const items = [line(5, 'Groundnut oil', 'OIL-002', '1508', 1120, 2)];
  const result = figures(1004, items, 'SAVE10');

  assert.deepStrictEqual(
    {
      subtotal: result.invoice.subtotal,
      discount: result.invoice.discount,
      tax: result.invoice.tax,
      cgst: result.invoice.cgst,
      sgst: result.invoice.sgst,
      total: result.invoice.total
    },
    {
      subtotal: result.checkout.subtotal,
      discount: result.checkout.discount,
      tax: result.checkout.tax,
      cgst: result.checkout.cgst,
      sgst: result.checkout.sgst,
      total: result.checkout.total
    }
  );
  assert.deepStrictEqual(
    result.invoice.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
    [{ gstPercent: 5, lineTax: 104.5 }]
  );
});

test('saved invoice keeps billed figures after its coupon is deactivated', () => {
  const items = [line(5, 'Groundnut oil', 'OIL-002', '1508', 1120, 2)];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const order = {
    id: 1004,
    items,
    coupon: 'SAVE10',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  const wasActive = config.coupons.SAVE10.active;

  config.coupons.SAVE10.active = false;
  try {
    const actual = invoice.computeInvoiceFigures(order);
    assert.deepStrictEqual(
      { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, total: actual.total },
      { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
    );
    assert.deepStrictEqual(
      actual.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
      [{ gstPercent: 5, lineTax: 104.5 }]
    );
  } finally {
    config.coupons.SAVE10.active = wasActive;
  }
});
