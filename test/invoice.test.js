'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Saved order lines have price, qty, and HSN. gstRate is not stored by the
// order route, so it is explicitly undefined here to mirror persisted orders.
function item(id, name, price, qty, hsn) {
  return { id, name, sku: `SKU-${id}`, price, qty, hsn, gstRate: undefined };
}

function compare(items, coupon) {
  return {
    invoice: invoice.computeInvoiceFigures({ items, coupon }),
    checkout: pricing.computeTotals(items, coupon)
  };
}

function assertFigures(actual, expected) {
  assert.equal(actual.subtotal, expected.subtotal);
  assert.equal(actual.discount, expected.discount);
  assert.equal(actual.tax, expected.tax);
  assert.equal(actual.cgst, expected.cgst);
  assert.equal(actual.sgst, expected.sgst);
  assert.equal(actual.total, expected.total);
  assert.deepEqual(actual.rows.map(row => ({
    gstPercent: row.gstPercent,
    line: row.line,
    lineTax: row.lineTax
  })), expected.rows);
}

test('INVOICE CHECKOUT PARITY: order #1001 applies the 18% and 5% HSN slabs', () => {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 140, 2, '0902'),
    item(2, 'Unpolished Toor Dal 1kg', 165, 2, '0713')
  ];
  const { invoice: actual, checkout } = compare(items, '');

  assertFigures(actual, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { gstPercent: 18, line: 280, lineTax: 50.4 },
      { gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.equal(checkout.tax, 66.9);
  assert.equal(checkout.total, 676.9);
});

test('INVOICE CHECKOUT PARITY: order #1002 applies SAVE10 to subtotal before 5% GST', () => {
  const items = [
    item(1, 'Indrayani Basmati Rice 5kg', 640, 1, '1006'),
    item(4, 'Cold-Pressed Sunflower Oil 1L', 190, 2, '1512')
  ];
  const { invoice: actual, checkout } = compare(items, 'SAVE10');

  assertFigures(actual, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.8 },
      { gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.9);
  assert.equal(checkout.total, 963.9);
});

test('INVOICE CHECKOUT PARITY: order #1004 applies the SAVE10 cap before 5% GST', () => {
  const items = [item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')];
  const { invoice: actual, checkout } = compare(items, 'SAVE10');

  assertFigures(actual, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [{ gstPercent: 5, line: 2240, lineTax: 104.5 }]
  });
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.5);
  assert.equal(checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: order #1008 invoice and checkout match for 18% HSN items without a coupon', () => {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 140, 1, '0902'),
    item(12, 'Kokum Sherbet Concentrate 750ml', 180, 2, '2106')
  ];
  const { invoice: actual, checkout } = compare(items, '');

  assertFigures(actual, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { gstPercent: 18, line: 140, lineTax: 25.2 },
      { gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.equal(checkout.tax, 90);
  assert.equal(checkout.total, 590);
});

test('Invoice matches checkout HSN slabs, capped pre-tax discount, GST, and total', () => {
  const cases = [
    {
      id: 1001,
      coupon: '',
      items: [
        item(8, 'Assam CTC Masala Chai 250g', 140, 2, '0902'),
        item(2, 'Unpolished Toor Dal 1kg', 165, 2, '0713')
      ]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        item(1, 'Indrayani Basmati Rice 5kg', 640, 1, '1006'),
        item(4, 'Cold-Pressed Sunflower Oil 1L', 190, 2, '1512')
      ]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')]
    },
    {
      id: 1008,
      coupon: '',
      items: [
        item(8, 'Assam CTC Masala Chai 250g', 140, 1, '0902'),
        item(12, 'Kokum Sherbet Concentrate 750ml', 180, 2, '2106')
      ]
    }
  ];

  for (const order of cases) {
    const actual = invoice.computeInvoiceFigures({ items: order.items, coupon: order.coupon });
    const checkout = pricing.computeTotals(order.items, order.coupon);
    assert.deepEqual({
      subtotal: actual.subtotal,
      discount: actual.discount,
      tax: actual.tax,
      cgst: actual.cgst,
      sgst: actual.sgst,
      total: actual.total
    }, {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    }, `order #${order.id} invoice totals should equal checkout`);
    assert.deepEqual(actual.rows.map(row => ({
      gstPercent: row.gstPercent,
      line: row.line,
      lineDiscount: row.lineDiscount,
      taxable: row.taxable,
      lineTax: row.lineTax
    })), checkout.lines.map(line => ({
      gstPercent: line.gstPercent,
      line: line.gross,
      lineDiscount: line.discount,
      taxable: line.taxable,
      lineTax: line.tax
    })), `order #${order.id} invoice lines should equal checkout`);
  }
});
