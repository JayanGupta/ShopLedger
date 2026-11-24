const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total,
      rates: checkout.lines.map((line) => line.gstPercent)
    },
    expectedCheckout
  );
}

// These mixed-slab fixtures rely on HSN codes when gstRate is absent.
test('CURRENT BEHAVIOUR: #1001-style mixed HSN slabs print at 5% and 12% without a coupon', () => {
  const items = [
    { id: 1, name: 'Dal', sku: 'DAL', hsn: '0713', price: 165, qty: 2 },
    { id: 2, name: 'Spices', sku: 'SPC', hsn: '0904', price: 120, qty: 2 }
  ];

  assertFigures({ items, coupon: '' }, {
    subtotal: 570, discount: 0, tax: 45.30, cgst: 22.65, sgst: 22.65, total: 615.30,
    rows: [
      { name: 'Dal', sku: 'DAL', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.50 },
      { name: 'Spices', sku: 'SPC', hsn: '0904', qty: 2, price: 120, gstPercent: 12, line: 240, lineTax: 28.80 }
    ]
  }, {
    subtotal: 570, discount: 0, tax: 45.30, cgst: 22.65, sgst: 22.65, total: 615.30, rates: [5, 12]
  });
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 reduces the taxable amount before GST', () => {
  const items = [
    { id: 3, name: 'Rice', sku: 'RCE', hsn: '1006', price: 640, qty: 1 }
  ];

  assertFigures({ items, coupon: 'SAVE10' }, {
    subtotal: 640, discount: 64, tax: 28.80, cgst: 14.40, sgst: 14.40, total: 604.80,
    rows: [
      { name: 'Rice', sku: 'RCE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.80 }
    ]
  }, {
    subtotal: 640, discount: 64, tax: 28.80, cgst: 14.40, sgst: 14.40, total: 604.80, rates: [5]
  });
});

test('CURRENT BEHAVIOUR: #1004-style SAVE10 on ₹2,240 honours the ₹150 cap before GST', () => {
  const items = [
    { id: 3, name: 'Rice', sku: 'RCE', hsn: '1006', price: 640, qty: 3 },
    { id: 4, name: 'Tea', sku: 'TEA', hsn: '0902', price: 160, qty: 2 }
  ];

  assertFigures({ items, coupon: 'SAVE10' }, {
    subtotal: 2240, discount: 150, tax: 143.31, cgst: 71.66, sgst: 71.65, total: 2233.31,
    rows: [
      { name: 'Rice', sku: 'RCE', hsn: '1006', qty: 3, price: 640, gstPercent: 5, line: 1920, lineTax: 89.57 },
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 2, price: 160, gstPercent: 18, line: 320, lineTax: 53.74 }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 143.31, cgst: 71.66, sgst: 71.65, total: 2233.31, rates: [5, 18]
  });
});

test('CURRENT BEHAVIOUR: #1008-style all-18% items match checkout without a coupon', () => {
  const items = [
    { id: 4, name: 'Tea', sku: 'TEA', hsn: '0902', price: 160, qty: 3 },
    { id: 5, name: 'Coffee', sku: 'COF', hsn: '0901', price: 140, qty: 2, gstRate: 18 }
  ];

  assertFigures({ items, coupon: '' }, {
    subtotal: 760, discount: 0, tax: 136.80, cgst: 68.40, sgst: 68.40, total: 896.80,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 3, price: 160, gstPercent: 18, line: 480, lineTax: 86.40 },
      { name: 'Coffee', sku: 'COF', hsn: '0901', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.40 }
    ]
  }, {
    subtotal: 760, discount: 0, tax: 136.80, cgst: 68.40, sgst: 68.40, total: 896.80, rates: [18, 18]
  });
});

test('invoice matches checkout for mixed GST slabs and capped SAVE10', () => {
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 2 },
    { id: 2, name: 'Butter', hsn: '0405', price: 240, qty: 4 }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { id: 1009, items, coupon, total: checkout.total };
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    [printed.subtotal, printed.discount, printed.tax, printed.cgst, printed.sgst, printed.total],
    [2240, 150, 167.20, 83.60, 83.60, 2257.20]
  );
  assert.deepEqual(
    printed.rows.map((row) => [row.gstPercent, row.lineTax]),
    checkout.lines.map((line) => [line.gstPercent, line.tax])
  );
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
