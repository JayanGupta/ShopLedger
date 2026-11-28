'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function compare(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(checkoutFigures, expectedCheckout);
}

test('CURRENT BEHAVIOUR: #1001 invoice and checkout with 5% and 12% items and no coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      line('Rice', 640, 1, '1006', 5),
      line('Ghee', 450, 1, '0405', 12)
    ]
  };

  compare(order,
    {
      subtotal: 1090,
      discount: 0,
      tax: 86,
      cgst: 43,
      sgst: 43,
      total: 1176,
      rows: [
        { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
        { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
      ]
    },
    {
      subtotal: 1090,
      discount: 0,
      taxable: 1090,
      tax: 86,
      cgst: 43,
      sgst: 43,
      total: 1176,
      lines: [
        { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 640, discount: 0, taxable: 640, tax: 32, net: 672 },
        { id: undefined, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 450, discount: 0, taxable: 450, tax: 54, net: 504 }
      ]
    });
});

test('invoice and checkout apply #1002 SAVE10 to the pre-tax subtotal before GST', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line('Rice', 640, 1, '1006', 5),
      line('Sunflower Oil', 190, 1, '1512', 5)
    ]
  };

  compare(order,
    {
      subtotal: 830,
      discount: 83,
      tax: 37.35,
      cgst: 18.68,
      sgst: 18.67,
      total: 784.35,
      rows: [
        { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Sunflower Oil', sku: '-', hsn: '1512', qty: 1, price: 190, gstPercent: 5, line: 190, lineTax: 8.55 }
      ]
    },
    {
      subtotal: 830,
      discount: 83,
      taxable: 747,
      tax: 37.35,
      cgst: 18.68,
      sgst: 18.67,
      total: 784.35,
      lines: [
        { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
        { id: undefined, name: 'Sunflower Oil', hsn: '1512', gstPercent: 5, gross: 190, discount: 19, taxable: 171, tax: 8.55, net: 179.55 }
      ]
    });
});

test('invoice and checkout honor the #1004 SAVE10 cap before GST', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Groundnut Oil', 1120, 2, '1508', 5)]
  };

  compare(order,
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Groundnut Oil', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    {
      subtotal: 2240,
      discount: 150,
      taxable: 2090,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      lines: [
        { id: undefined, name: 'Groundnut Oil', hsn: '1508', gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
      ]
    });
});

test('CURRENT BEHAVIOUR: #1008 no-coupon 18% items use matching GST and totals', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      line('Packaged Tea', 140, 1, '0902', 18),
      line('Syrup', 250, 1, '2106', 18)
    ]
  };

  compare(order,
    {
      subtotal: 390,
      discount: 0,
      tax: 70.2,
      cgst: 35.1,
      sgst: 35.1,
      total: 460.2,
      rows: [
        { name: 'Packaged Tea', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Syrup', sku: '-', hsn: '2106', qty: 1, price: 250, gstPercent: 18, line: 250, lineTax: 45 }
      ]
    },
    {
      subtotal: 390,
      discount: 0,
      taxable: 390,
      tax: 70.2,
      cgst: 35.1,
      sgst: 35.1,
      total: 460.2,
      lines: [
        { id: undefined, name: 'Packaged Tea', hsn: '0902', gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
        { id: undefined, name: 'Syrup', hsn: '2106', gstPercent: 18, gross: 250, discount: 0, taxable: 250, tax: 45, net: 295 }
      ]
    });
});

test('invoice uses checkout HSN GST and capped pre-tax coupon figures for #1004', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Groundnut Oil', 1120, 2, '1508')]
  };
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
      rows: invoiceFigures.rows.map(function (row) {
        return { hsn: row.hsn, gstPercent: row.gstPercent, lineTax: row.lineTax };
      })
    },
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      rows: checkoutFigures.lines.map(function (line) {
        return { hsn: line.hsn, gstPercent: line.gstPercent, lineTax: line.tax };
      })
    }
  );
});
