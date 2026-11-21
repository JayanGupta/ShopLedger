'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function assertCurrentFigures(order, expectedInvoice, expectedBilled) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, expectedInvoice);
  assert.deepStrictEqual(
    { subtotal: billedFigures.subtotal, discount: billedFigures.discount,
      tax: billedFigures.tax, cgst: billedFigures.cgst,
      sgst: billedFigures.sgst, total: billedFigures.total },
    expectedBilled
  );
}

test('CURRENT BEHAVIOUR: order #1001 uses the HSN 5% and 12% GST slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Rice', 100, 1, '1006', 0.05),
      item('Ghee', 100, 1, '0405', 0.12)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 200, discount: 0, tax: 17, cgst: 8.5, sgst: 8.5,
    total: 217,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 100, gstPercent: 5, line: 100, lineTax: 5 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 100, gstPercent: 12, line: 100, lineTax: 12 }
    ]
  }, {
    subtotal: 200, discount: 0, tax: 17, cgst: 8.5, sgst: 8.5, total: 217
  });
});

test('CURRENT BEHAVIOUR: order #1002 SAVE10 discounts subtotal before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Rice', 640, 1, '1006', 0.05),
      item('Ghee', 380, 1, '0405', 0.12)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 1020, discount: 102, tax: 69.84, cgst: 34.92, sgst: 34.92,
    total: 987.84,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 380, gstPercent: 12, line: 380, lineTax: 41.04 }
    ]
  }, {
    subtotal: 1020, discount: 102, tax: 69.84, cgst: 34.92, sgst: 34.92, total: 987.84
  });
});

test('CURRENT BEHAVIOUR: order #1004 SAVE10 discount on ₹2,240 uses the ₹150 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Groundnut Oil', 1120, 2, '1508', 0.05)]
  };

  assertCurrentFigures(order, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: order #1008 applies the HSN 18% GST slabs', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item('Tea', 140, 1, '0902', 0.18),
      item('Syrup', 180, 2, '2106', 0.18)
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45,
    total: 590,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Syrup', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
});


test('CORRECT BEHAVIOUR: invoice matches checkout figures and line GST for orders #1001, #1002, #1004 and #1008', () => {
  const orders = [
    { id: 1001, coupon: '', items: [
      item('Rice', 100, 1, '1006', 0.05),
      item('Ghee', 100, 1, '0405', 0.12)
    ] },
    { id: 1002, coupon: 'SAVE10', items: [
      item('Rice', 640, 1, '1006', 0.05),
      item('Ghee', 380, 1, '0405', 0.12)
    ] },
    { id: 1004, coupon: 'SAVE10', items: [
      item('Groundnut Oil', 1120, 2, '1508', 0.05)
    ] },
    { id: 1008, coupon: '', items: [
      item('Tea', 140, 1, '0902', 0.18),
      item('Syrup', 180, 2, '2106', 0.18)
    ] }
  ];

  for (const order of orders) {
    const billed = pricing.computeTotals(order.items, order.coupon);
    const invoiced = invoice.computeInvoiceFigures(order);

    assert.deepStrictEqual(
      { subtotal: invoiced.subtotal, discount: invoiced.discount,
        tax: invoiced.tax, cgst: invoiced.cgst, sgst: invoiced.sgst,
        total: invoiced.total },
      { subtotal: billed.subtotal, discount: billed.discount,
        tax: billed.tax, cgst: billed.cgst, sgst: billed.sgst,
        total: billed.total },
      `order #${order.id} invoice totals should match checkout`
    );
    assert.deepStrictEqual(invoiced.rows, billed.lines.map((line, index) => ({
      name: order.items[index].name,
      sku: '-',
      hsn: order.items[index].hsn,
      qty: order.items[index].qty,
      price: order.items[index].price,
      gstPercent: line.gstPercent,
      line: line.gross,
      lineTax: line.tax
    })), `order #${order.id} invoice lines should match checkout GST`);
  }
});
