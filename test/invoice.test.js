'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, sku, hsn, price, qty) {
  return { name, sku, hsn, price, qty, gstRate: null };
}

const cases = [
  {
    id: 1001,
    coupon: '',
    items: [
      line('Rice', 'GRN-001', '1006', 350, 1),
      line('Ghee', 'DRY-001', '0405', 260, 1)
    ],
    checkout: { subtotal: 610, discount: 0, tax: 48.7, cgst: 24.35, sgst: 24.35, total: 658.7, gstPercent: [5, 12] },
    invoice: { subtotal: 610, discount: 0, tax: 48.7, cgst: 24.35, sgst: 24.35, total: 658.7, gstPercent: [5, 12] }
  },
  {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line('Rice', 'GRN-001', '1006', 640, 1),
      line('Sunflower Oil', 'OIL-001', '1512', 190, 2)
    ],
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gstPercent: [5, 5] },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gstPercent: [5, 5] }
  },
  {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Groundnut Oil', 'OIL-002', '1508', 1120, 2)],
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercent: [5] },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercent: [5] }
  },
  {
    id: 1008,
    coupon: '',
    items: [
      line('Packaged Tea', 'BEV-001', '0902', 140, 1),
      line('Kokum Concentrate', 'BEV-003', '2106', 180, 2)
    ],
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gstPercent: [18, 18] },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gstPercent: [18, 18] }
  }
];

function summary(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    gstPercent: figures.rows ? figures.rows.map((row) => row.gstPercent) : figures.lines.map((row) => row.gstPercent)
  };
}

for (const sample of cases) {
  test('CURRENT BEHAVIOUR: invoice figures for order #' + sample.id, () => {
    const order = { id: sample.id, coupon: sample.coupon, items: sample.items };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(summary(invoiceFigures), sample.invoice);
    assert.deepEqual(summary(checkoutFigures), sample.checkout);
  });
}

test('invoice matches checkout HSN slabs, coupon discount, GST, and total', () => {
  for (const sample of cases) {
    const order = { id: sample.id, coupon: sample.coupon, items: sample.items };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(summary(invoiceFigures), summary(checkoutFigures), 'order #' + sample.id + ' totals');
    assert.deepEqual(
      invoiceFigures.rows.map((row) => ({
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        line: row.line,
        discount: row.discount,
        taxable: row.taxable,
        lineTax: row.lineTax
      })),
      checkoutFigures.lines.map((row) => ({
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        line: row.gross,
        discount: row.discount,
        taxable: row.taxable,
        lineTax: row.tax
      })),
      'order #' + sample.id + ' line breakdown'
    );

    const rendered = invoice.render(order);
    assert.ok(rendered.includes('Invoice Total</td><td class="r">₹' + checkoutFigures.total.toFixed(2)), 'order #' + sample.id + ' rendered total');
    checkoutFigures.lines.forEach((line) => {
      const breakdown = 'Coupon share: -₹' + line.discount.toFixed(2) + ' · Taxable: ₹' + line.taxable.toFixed(2);
      assert.ok(rendered.includes(breakdown), 'order #' + sample.id + ' rendered line breakdown');
    });
  }
});
