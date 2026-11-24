'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These are in-memory order models. Missing gstRate is intentional: the
// checkout tax calculation resolves the GST slab from each item's HSN.
const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-style 5% and 12% HSN items print their checkout GST',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
        { id: 6, sku: 'DRY-001', name: 'Ghee', hsn: '0405', price: 450, qty: 1 }
      ]
    },
    checkout: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176, slabs: [5, 12] },
    printed: {
      subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
        { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
      ]
    },
    differs: false
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 prints discounted 5% GST and checkout total',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
        { id: 4, sku: 'OIL-001', name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
      ]
    },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, slabs: [5, 5] },
    printed: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Sunflower oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    differs: false
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 SAVE10 on ₹2240 prints the ₹150 checkout cap',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { id: 5, sku: 'OIL-002', name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
      ]
    },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, slabs: [5] },
    printed: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    differs: false
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% items without a coupon match checkout',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', gstRate: 18, price: 140, qty: 2 },
        { id: 12, sku: 'BEV-003', name: 'Syrup', hsn: '2106', price: 220, qty: 1 }
      ]
    },
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, slabs: [18, 18] },
    printed: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
        { name: 'Syrup', sku: 'BEV-003', hsn: '2106', qty: 1, price: 220, gstPercent: 18, line: 220, lineTax: 39.6 }
      ]
    },
    differs: false
  }
];

for (const sample of cases) {
  test(sample.name, () => {
    const billed = pricing.computeTotals(sample.order.items, sample.order.coupon);
    const printed = invoice.computeInvoiceFigures(sample.order);

    assert.deepStrictEqual({
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total,
      slabs: billed.lines.map((line) => line.gstPercent)
    }, sample.checkout);
    assert.deepStrictEqual(printed, sample.printed);
    assert.equal(printed.total !== billed.total || printed.tax !== billed.tax, sample.differs);
  });
}

test('Invoice matches checkout and preserves historical billing without hiding inconsistent totals', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 1120, qty: 1 },
      { id: 6, name: 'Ghee', hsn: '0405', price: 1120, qty: 1 }
    ]
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual({
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total
  }, { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 });
  assert.deepStrictEqual({
    subtotal: printed.subtotal,
    discount: printed.discount,
    tax: printed.tax,
    cgst: printed.cgst,
    sgst: printed.sgst,
    total: printed.total
  }, { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 });
  assert.deepStrictEqual(printed.rows.map((row) => [row.gstPercent, row.lineTax]), [
    [5, 52.25],
    [12, 125.4]
  ]);

  const historicalOrder = {
    coupon: 'DIWALI20', // Inactive now; its discount was recorded when billed.
    items: [{ id: 8, name: 'Tea', hsn: '0902', price: 1000, qty: 1 }],
    subtotal: 1000,
    discount: 200,
    tax: 144,
    total: 944
  };
  const historicalInvoice = invoice.computeInvoiceFigures(historicalOrder);
  assert.deepStrictEqual({
    subtotal: historicalInvoice.subtotal,
    discount: historicalInvoice.discount,
    tax: historicalInvoice.tax,
    cgst: historicalInvoice.cgst,
    sgst: historicalInvoice.sgst,
    total: historicalInvoice.total,
    lineTax: historicalInvoice.rows[0].lineTax
  }, { subtotal: 1000, discount: 200, tax: 144, cgst: 72, sgst: 72, total: 944, lineTax: 144 });

  const inconsistentOrder = {
    coupon: '',
    items: [{ id: 8, name: 'Tea', hsn: '0902', price: 100, qty: 1 }],
    subtotal: 100,
    discount: 0,
    tax: 18,
    total: 100
  };
  assert.equal(invoice.computeInvoiceFigures(inconsistentOrder).total, 118);

  const legacyTaxOrder = {
    coupon: '',
    items: [{ id: 1, name: 'Rice', hsn: '1006', price: 1000, qty: 1 }],
    subtotal: 1000,
    discount: 0,
    tax: 180,
    total: 1180
  };
  const legacyInvoice = invoice.computeInvoiceFigures(legacyTaxOrder);
  assert.deepStrictEqual({
    tax: legacyInvoice.tax,
    total: legacyInvoice.total,
    gstPercent: legacyInvoice.rows[0].gstPercent,
    lineTax: legacyInvoice.rows[0].lineTax
  }, { tax: 180, total: 1180, gstPercent: 18, lineTax: 180 });
});
