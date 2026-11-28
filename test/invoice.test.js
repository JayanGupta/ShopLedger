'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function checkCurrentFigures(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax }))
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

test('CURRENT BEHAVIOUR: order #1001 style, no coupon, invoice calculates 5% and 12% GST', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Rice', 640, 1, '1006', 5),
      item('Ghee', 450, 1, '0405', 12)
    ]
  };

  checkCurrentFigures(order, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 32 },
      { hsn: '0405', gstPercent: 12, line: 450, lineTax: 54 }
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

test('order #1002 style SAVE10 invoice matches checkout discount and GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Rice', 640, 1, '1006', 5),
      item('Sunflower oil', 190, 2, '1512', 5)
    ]
  };

  checkCurrentFigures(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
});

test('order #1004 style SAVE10 invoice applies the ₹150 cap before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Groundnut oil', 1120, 2, '1508', 5)]
  };

  checkCurrentFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: order #1008 style, no coupon, all lines at 18% GST', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item('Packaged tea', 140, 1, '0902', 18),
      item('Kokum concentrate', 180, 2, '2106', 18)
    ]
  };

  checkCurrentFigures(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.2 },
      { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590
  });
});

test('Invoice matches checkout HSN slabs and capped coupon discount before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 1000, qty: 1, hsn: '1006' },
      { name: 'Ghee', price: 1240, qty: 1, hsn: '0405' }
    ]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax }))
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    rows: checkoutFigures.lines.map(({ hsn, gstPercent, tax }) => ({ hsn, gstPercent, lineTax: tax }))
  });
});
