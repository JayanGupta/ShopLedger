'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

function line(id, name, hsn, price, qty, gstRate) {
  return { id, name, sku: `SKU-${id}`, hsn, price, qty, gstRate };
}

function characterizeInvoice(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rows: invoiceFigures.rows.map(({ gstPercent, line, discount, taxable, lineTax, net }) => ({ gstPercent, line, discount, taxable, lineTax, net }))
    },
    expectedInvoice
  );
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total
    },
    expectedCheckout
  );
}

test('#1001 invoice matches checkout (5% and 12% GST, no coupon)', () => {
  characterizeInvoice(
    {
      id: 1001,
      coupon: '',
      items: [
        line(1, 'Indrayani Basmati Rice 5kg', '1006', 640, 1, 5),
        line(6, 'A2 Gir Cow Ghee 500ml', '0405', 450, 1, 12)
      ]
    },
    {
      subtotal: 1090,
      discount: 0,
      tax: 86,
      cgst: 43,
      sgst: 43,
      total: 1176,
      rows: [
        { gstPercent: 5, line: 640, discount: 0, taxable: 640, lineTax: 32, net: 672 },
        { gstPercent: 12, line: 450, discount: 0, taxable: 450, lineTax: 54, net: 504 }
      ]
    },
    { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 }
  );
});

test('#1002 invoice matches checkout (SAVE10 before tax)', () => {
  characterizeInvoice(
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        line(1, 'Indrayani Basmati Rice 5kg', '1006', 640, 1, 5),
        line(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2, 5)
      ]
    },
    {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      rows: [
        { gstPercent: 5, line: 640, discount: 64, taxable: 576, lineTax: 28.8, net: 604.8 },
        { gstPercent: 5, line: 380, discount: 38, taxable: 342, lineTax: 17.1, net: 359.1 }
      ]
    },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
});

test('#1004 invoice matches checkout (SAVE10 cap before tax)', () => {
  characterizeInvoice(
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [line(5, 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, 5)]
    },
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [{ gstPercent: 5, line: 2240, discount: 150, taxable: 2090, lineTax: 104.5, net: 2194.5 }]
    },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('#1008 invoice matches checkout (all 18%, no coupon)', () => {
  characterizeInvoice(
    {
      id: 1008,
      coupon: '',
      items: [
        line(8, 'Assam CTC Masala Chai 250g', '0902', 140, 1, 18),
        line(12, 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2, 18)
      ]
    },
    {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      rows: [
        { gstPercent: 18, line: 140, discount: 0, taxable: 140, lineTax: 25.2, net: 165.2 },
        { gstPercent: 18, line: 360, discount: 0, taxable: 360, lineTax: 64.8, net: 424.8 }
      ]
    },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
});

test('odd-paisa GST splits with the extra paisa on CGST', () => {
  characterizeInvoice(
    { id: 9001, coupon: '', items: [line(1, 'Indrayani Basmati Rice 5kg', '1006', 101, 1, 5)] },
    {
      subtotal: 101,
      discount: 0,
      tax: 5.05,
      cgst: 2.53,
      sgst: 2.52,
      total: 106.05,
      rows: [{ gstPercent: 5, line: 101, discount: 0, taxable: 101, lineTax: 5.05, net: 106.05 }]
    },
    { subtotal: 101, discount: 0, tax: 5.05, cgst: 2.53, sgst: 2.52, total: 106.05 }
  );
});

test('GST reconciliation flags an order whose stored tax differs from the invoice', () => {
  const order = {
    id: 1004,
    status: 'completed',
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 999,
    total: 3089,
    items: [line(5, 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, 5)]
  };
  const row = reports.getGstReconciliation({ orders: [order] }).rows[0];

  assert.equal(row.invoiceTax, 104.5);
  assert.equal(row.invoiceTotal, 2194.5);
  assert.equal(row.matched, false);
});
