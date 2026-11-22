'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic fixtures only: no database or store imports. Rates are percentages.
// #1001 deliberately models the requested 5%/12% mix, not a database copy.
const mixedItems = [
  { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
  { id: 7, name: 'Butter', sku: 'BUTTER', price: 260, qty: 1, hsn: '0405', gstRate: 12 }
];

function amounts(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 explicit 5% and 12%, no coupon',
    order: { id: 1001, items: mixedItems, coupon: '' },
    invoice: { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 },
    checkout: { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 },
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Butter', sku: 'BUTTER', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
    ]
  },
  {
    name: '#1002 SAVE10 matches checkout total, GST and discount',
    order: {
      id: 1002, coupon: 'SAVE10', items: [
        { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
        { id: 4, name: 'Oil', sku: 'OIL', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
      ]
    },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Oil', sku: 'OIL', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  },
  {
    name: '#1004 SAVE10 respects the 150 cap on 2240',
    order: {
      id: 1004, coupon: 'SAVE10', items: [
        { id: 5, name: 'Bulk oil', sku: 'BULK-OIL', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
      ]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    rows: [
      { name: 'Bulk oil', sku: 'BULK-OIL', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18%, no coupon, matches checkout',
    order: {
      id: 1008, coupon: '', items: [
        { id: 8, name: 'Tea', sku: 'TEA', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
        { id: 12, name: 'Sherbet', sku: 'SHERBET', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
      ]
    },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Sherbet', sku: 'SHERBET', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  },
  {
    name: '#1001 HSN-only lines use checkout GST slabs on invoice',
    order: {
      id: 1001, coupon: '',
      items: mixedItems.map(({ gstRate, ...item }) => item)
    },
    invoice: { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 },
    checkout: { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 },
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Butter', sku: 'BUTTER', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
    ]
  }
];

for (const fixture of cases) {
  test(fixture.name, () => {
    // Both paths receive the same item array and coupon; expectations are literals.
    const actualInvoice = invoice.computeInvoiceFigures(fixture.order);
    const actualCheckout = pricing.computeTotals(fixture.order.items, fixture.order.coupon);

    assert.deepStrictEqual(actualInvoice, { ...fixture.invoice, rows: fixture.rows });
    assert.deepStrictEqual(amounts(actualCheckout), fixture.checkout);
  });
}

test('Invoice matches checkout for mixed HSN slabs and capped SAVE10 before tax', () => {
  const order = {
    id: 2001, coupon: 'SAVE10', items: [
      { id: 5, name: 'Bulk oil', price: 1120, qty: 2, hsn: '1508' },
      { id: 7, name: 'Butter', price: 260, qty: 1, hsn: '0405' }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const actual = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(amounts(actual), {
    subtotal: 2500, discount: 150, tax: 134.61,
    cgst: 67.31, sgst: 67.3, total: 2484.61
  });
  assert.deepStrictEqual(amounts(actual), amounts(checkout));
  assert.deepStrictEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [
    [5, 105.28], [12, 29.33]
  ]);
  const html = invoice.render({ ...order, total: checkout.total });
  assert.ok(html.includes('2484.61'));
  assert.ok(html.includes('105.28'));
  assert.ok(html.includes('29.33'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));
});
