'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return { id, name, price, qty, hsn, gstRate };
}

function order(id, items, coupon) {
  return { id, items, coupon };
}

function invoiceSnapshot(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    taxable: figures.taxable,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(function (row) {
      return {
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        gross: row.line,
        discount: row.discount,
        taxable: row.taxable,
        tax: row.lineTax,
        net: row.net
      };
    })
  };
}

function pricingSnapshot(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    taxable: figures.taxable,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.lines.map(function (line) {
      return {
        hsn: line.hsn,
        gstPercent: line.gstPercent,
        gross: line.gross,
        discount: line.discount,
        taxable: line.taxable,
        tax: line.tax,
        net: line.net
      };
    })
  };
}

function assertCurrentFigures(orderData, expected) {
  const invoiceFigures = invoice.computeInvoiceFigures(orderData);
  const checkoutFigures = pricing.computeTotals(orderData.items, orderData.coupon);

  assert.deepEqual(invoiceSnapshot(invoiceFigures), expected);
  assert.deepEqual(pricingSnapshot(checkoutFigures), expected);
}

test('CURRENT BEHAVIOUR: #1001 applies 5% and 12% GST with no coupon', function () {
  assertCurrentFigures(order(1001, [
    item('rice', 'Rice', 120, 2, '1006', 5),
    item('ghee', 'Ghee', 250, 1, '0405', 12)
  ], ''), {
    subtotal: 490,
    discount: 0,
    taxable: 490,
    tax: 42,
    cgst: 21,
    sgst: 21,
    total: 532,
    rows: [
      { hsn: '1006', gstPercent: 5, gross: 240, discount: 0, taxable: 240, tax: 12, net: 252 },
      { hsn: '0405', gstPercent: 12, gross: 250, discount: 0, taxable: 250, tax: 30, net: 280 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST', function () {
  assertCurrentFigures(order(1002, [
    item('tea', 'Tea', 400, 2, '0902', 18),
    item('chilli', 'Chilli Powder', 160, 1, '0904', 12)
  ], 'SAVE10'), {
    subtotal: 960,
    discount: 96,
    taxable: 864,
    tax: 146.88,
    cgst: 73.44,
    sgst: 73.44,
    total: 1010.88,
    rows: [
      { hsn: '0902', gstPercent: 18, gross: 800, discount: 80, taxable: 720, tax: 129.6, net: 849.6 },
      { hsn: '0904', gstPercent: 12, gross: 160, discount: 16, taxable: 144, tax: 17.28, net: 161.28 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 caps SAVE10 at ₹150 on ₹2,240', function () {
  assertCurrentFigures(order(1004, [
    item('rice-bulk', 'Rice Bulk Pack', 1040, 1, '1006', 5),
    item('ghee-bulk', 'Ghee Bulk Pack', 1200, 1, '0405', 12)
  ], 'SAVE10'), {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 182.88,
    cgst: 91.44,
    sgst: 91.44,
    total: 2272.88,
    rows: [
      { hsn: '1006', gstPercent: 5, gross: 1040, discount: 69.64, taxable: 970.36, tax: 48.52, net: 1018.88 },
      { hsn: '0405', gstPercent: 12, gross: 1200, discount: 80.36, taxable: 1119.64, tax: 134.36, net: 1254 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 applies 18% GST with no coupon', function () {
  assertCurrentFigures(order(1008, [
    item('coffee', 'Coffee', 350, 2, '0901', 18),
    item('syrup', 'Syrup', 250, 1, '2106', 18)
  ], ''), {
    subtotal: 950,
    discount: 0,
    taxable: 950,
    tax: 171,
    cgst: 85.5,
    sgst: 85.5,
    total: 1121,
    rows: [
      { hsn: '0901', gstPercent: 18, gross: 700, discount: 0, taxable: 700, tax: 126, net: 826 },
      { hsn: '2106', gstPercent: 18, gross: 250, discount: 0, taxable: 250, tax: 45, net: 295 }
    ]
  });
});

test('FIX: invoice matches checkout HSN tax and capped pre-tax discount without gstRate', function () {
  const orderData = order(1004, [
    { id: 'rice-bulk', name: 'Rice Bulk Pack', price: 1040, qty: 1, hsn: '1006', gstRate: null },
    { id: 'ghee-bulk', name: 'Ghee Bulk Pack', price: 1200, qty: 1, hsn: '0405', gstRate: null }
  ], 'SAVE10');
  const expected = {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 182.88,
    cgst: 91.44,
    sgst: 91.44,
    total: 2272.88,
    rows: [
      { hsn: '1006', gstPercent: 5, gross: 1040, discount: 69.64, taxable: 970.36, tax: 48.52, net: 1018.88 },
      { hsn: '0405', gstPercent: 12, gross: 1200, discount: 80.36, taxable: 1119.64, tax: 134.36, net: 1254 }
    ]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(orderData);
  const checkoutFigures = pricing.computeTotals(orderData.items, orderData.coupon);

  assert.deepEqual(invoiceSnapshot(invoiceFigures), expected);
  assert.deepEqual(pricingSnapshot(checkoutFigures), expected);
});
