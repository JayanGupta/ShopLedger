'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, sku, price, qty, hsn, gstRate) {
  return { id, name, sku, price, qty, hsn, gstRate };
}

function characterize(orderId, items, coupon, expectedInvoice, expectedCheckout) {
  const order = { id: orderId, items, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax }))
  }, expectedInvoice);

  assert.deepEqual({
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total
  }, expectedCheckout);
}

test('CURRENT BEHAVIOUR: order #1001 has 5% and 12% invoice GST without a coupon', () => {
  characterize(1001, [
    item(1, 'Rice', 'GRN-001', 640, 1, '1006', 5),
    item(6, 'Ghee', 'DRY-001', 450, 1, '0405', 12)
  ], '', {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 32 },
      { gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('CURRENT BEHAVIOUR: order #1002 SAVE10 discount is applied before GST', () => {
  characterize(1002, [
    item(1, 'Rice', 'GRN-001', 640, 1, '1006', 5),
    item(6, 'Ghee', 'DRY-001', 450, 1, '0405', 12),
    item(9, 'Coffee', 'BEV-002', 310, 1, '0901', 18)
  ], 'SAVE10', {
    subtotal: 1400,
    discount: 140,
    tax: 127.62,
    cgst: 63.81,
    sgst: 63.81,
    total: 1387.62,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.8 },
      { gstPercent: 12, line: 450, lineTax: 48.6 },
      { gstPercent: 18, line: 310, lineTax: 50.22 }
    ]
  }, {
    subtotal: 1400,
    discount: 140,
    tax: 127.62,
    cgst: 63.81,
    sgst: 63.81,
    total: 1387.62
  });
});

test('CURRENT BEHAVIOUR: order #1004 invoice SAVE10 uses its ₹150 discount cap', () => {
  characterize(1004, [
    item(1, 'Rice', 'GRN-001', 640, 1, '1006', 5),
    item(6, 'Ghee', 'DRY-001', 450, 1, '0405', 12),
    item(9, 'Coffee', 'BEV-002', 575, 2, '0901', 18)
  ], 'SAVE10', {
    subtotal: 2240,
    discount: 150,
    tax: 273.38,
    cgst: 136.69,
    sgst: 136.69,
    total: 2363.38,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 29.86 },
      { gstPercent: 12, line: 450, lineTax: 50.38 },
      { gstPercent: 18, line: 1150, lineTax: 193.14 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 273.38,
    cgst: 136.69,
    sgst: 136.69,
    total: 2363.38
  });
});

test('CURRENT BEHAVIOUR: order #1008 all-18% invoice without a coupon', () => {
  characterize(1008, [
    item(8, 'Tea', 'BEV-001', 140, 2, '0902', 18),
    item(9, 'Coffee', 'BEV-002', 310, 1, '0901', 18)
  ], '', {
    subtotal: 590,
    discount: 0,
    tax: 106.2,
    cgst: 53.1,
    sgst: 53.1,
    total: 696.2,
    rows: [
      { gstPercent: 18, line: 280, lineTax: 50.4 },
      { gstPercent: 18, line: 310, lineTax: 55.8 }
    ]
  }, {
    subtotal: 590,
    discount: 0,
    tax: 106.2,
    cgst: 53.1,
    sgst: 53.1,
    total: 696.2
  });
});

test('CORRECT BEHAVIOUR: order #1004 invoice matches checkout with HSN GST and capped SAVE10', () => {
  const items = [
    item(1, 'Rice', 'GRN-001', 640, 1, '1006', 5),
    item(6, 'Ghee', 'DRY-001', 450, 1, '0405', 12),
    item(9, 'Coffee', 'BEV-002', 575, 2, '0901', 18)
  ];
  const invoiceFigures = invoice.computeInvoiceFigures({ id: 1004, items, coupon: 'SAVE10' });
  const checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax }))
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    rows: checkoutFigures.lines.map(({ gstPercent, gross, tax }) => ({ gstPercent, line: gross, lineTax: tax }))
  });
});
