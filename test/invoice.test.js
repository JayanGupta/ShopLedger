const { test } = require('node:test');
const assert = require('node:assert/strict');
const { coupons } = require('../config');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(actual, expected) {
  const { subtotal, discount, tax, cgst, sgst, total } = actual;
  assert.deepStrictEqual({ subtotal, discount, tax, cgst, sgst, total }, expected);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  const items = [
    { id: 2, name: 'Toor dal', hsn: '0713', price: 165, qty: 2 },
    { id: 7, name: 'Table butter', hsn: '0405', price: 260, qty: 1 }
  ];
  const coupon = '';
  const billed = pricing.computeTotals(items, coupon);
  assertFigures(billed, {
    subtotal: 590, discount: 0, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70
  });
  assert.deepStrictEqual(billed.lines.map(({ gstPercent }) => gstPercent), [5, 12]);

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  assertFigures(printed, {
    subtotal: 590, discount: 0, tax: 47.70, cgst: 23.85, sgst: 23.85, total: 637.70
  });
  assert.deepStrictEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 5, lineTax: 16.50 }, { gstPercent: 12, lineTax: 31.20 }]
  );
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [
    { id: 1, name: 'Basmati rice', hsn: '1006', price: 640, qty: 1 },
    { id: 4, name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
  ];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  assertFigures(billed, {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  assertFigures(printed, {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepStrictEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 5, lineTax: 28.80 }, { gstPercent: 5, lineTax: 17.10 }]
  );
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the ₹150 SAVE10 cap', () => {
  const items = [
    { id: 5, name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
  ];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  assertFigures(billed, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });

  const printed = invoice.computeInvoiceFigures({ items, coupon });
  assertFigures(printed, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepStrictEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 5, lineTax: 104.50 }]
  );
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const items = [
    { id: 8, name: 'Masala chai', hsn: '0902', price: 140, qty: 2 },
    { id: 9, name: 'Coffee blend', hsn: '0901', gstRate: 18, price: 250, qty: 1 }
  ];
  const coupon = '';
  const printed = invoice.computeInvoiceFigures({ items, coupon });
  const billed = pricing.computeTotals(items, coupon);
  const expected = {
    subtotal: 530, discount: 0, tax: 95.40, cgst: 47.70, sgst: 47.70, total: 625.40
  };

  assertFigures(printed, expected);
  assert.deepStrictEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 18, lineTax: 50.40 }, { gstPercent: 18, lineTax: 45 }]
  );
  assertFigures(billed, expected);
});

test('invoice matches checkout for mixed GST slabs and a capped SAVE10 coupon', () => {
  const items = [
    { id: 5, name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 1 },
    { id: 7, name: 'Table butter', hsn: '0405', price: 280, qty: 4 }
  ];
  const coupon = 'SAVE10';
  const expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65
  };
  const billed = pricing.computeTotals(items, coupon);
  const order = { items, coupon, discount: billed.discount, total: billed.total };
  const printed = invoice.computeInvoiceFigures(order);

  assertFigures(billed, expected);
  assertFigures(printed, expected);
  assert.deepStrictEqual(
    printed.rows.map(({ hsn, gstPercent, taxable, lineTax }) => ({ hsn, gstPercent, taxable, lineTax })),
    [
      { hsn: '1508', gstPercent: 5, taxable: 1045, lineTax: 52.25 },
      { hsn: '0405', gstPercent: 12, taxable: 1045, lineTax: 125.40 }
    ]
  );
  const html = invoice.render(order);
  assert.match(html, /<th class="r">Taxable Amt<\/th>/);
  assert.match(html, /₹1045\.00<\/td><td class="r">12%<\/td><td class="r">₹125\.40/);

  const wasActive = coupons.SAVE10.active;
  coupons.SAVE10.active = false;
  try {
    assert.deepStrictEqual(invoice.computeInvoiceFigures(order), printed);
  } finally {
    coupons.SAVE10.active = wasActive;
  }
});
