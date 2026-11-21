'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    pricing: pricing.computeTotals(order.items, order.coupon)
  };
}

function summary(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total,
    rows: result.rows.map(function (row) {
      return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    })
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice calculates mixed 5% and 12% lines without a coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Toor Dal', sku: 'GRN-002', hsn: '0713', gstRate: 5, price: 165, qty: 2 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 2 }
    ]
  };
  const result = figures(order);

  assert.deepEqual(summary(result.invoice), {
    subtotal: 1230,
    discount: 0,
    tax: 124.5,
    cgst: 62.25,
    sgst: 62.25,
    total: 1354.5,
    rows: [
      { hsn: '0713', gstPercent: 5, line: 330, lineTax: 16.5 },
      { hsn: '0405', gstPercent: 12, line: 900, lineTax: 108 }
    ]
  });
  assert.equal(result.pricing.tax, 124.5);
  assert.equal(result.pricing.total, 1354.5);
});

test('#1002 invoice matches checkout with SAVE10 discount before tax', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', gstRate: 5, price: 190, qty: 2 }
    ]
  };
  const result = figures(order);

  assert.deepEqual(summary(result.invoice), {
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
  });
  assert.equal(result.pricing.discount, 102);
  assert.equal(result.pricing.tax, 45.9);
  assert.equal(result.pricing.total, 963.9);
});

test('#1004 invoice applies SAVE10 maxDiscount before tax on ₹2,240', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ]
  };
  const result = figures(order);

  assert.deepEqual(summary(result.invoice), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [{ hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }]
  });
  assert.equal(result.pricing.discount, 150);
  assert.equal(result.pricing.tax, 104.5);
  assert.equal(result.pricing.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 no-coupon invoice matches pricing for 18% lines', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { name: 'Kokum Sherbet', sku: 'BEV-003', hsn: '2106', gstRate: 18, price: 180, qty: 2 }
    ]
  };
  const result = figures(order);

  assert.deepEqual(summary(result.invoice), {
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
  });
  assert.equal(result.pricing.tax, 90);
  assert.equal(result.pricing.total, 590);
});

test('invoice figures match checkout for HSN lines and capped coupons', function () {
  const orders = [
    {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Toor Dal', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2 },
        { name: 'Ghee', sku: 'DRY-001', hsn: '0405', price: 450, qty: 2 }
      ]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
        { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
      ]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [{ name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }]
    },
    {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1 },
        { name: 'Kokum Sherbet', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2 }
      ]
    }
  ];

  for (const order of orders) {
    const actual = invoice.computeInvoiceFigures(order);
    const billed = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(
      {
        subtotal: actual.subtotal,
        discount: actual.discount,
        tax: actual.tax,
        cgst: actual.cgst,
        sgst: actual.sgst,
        total: actual.total,
        lines: actual.rows.map(function (line) {
          return { hsn: line.hsn, gstPercent: line.gstPercent, tax: line.lineTax };
        })
      },
      {
        subtotal: billed.subtotal,
        discount: billed.discount,
        tax: billed.tax,
        cgst: billed.cgst,
        sgst: billed.sgst,
        total: billed.total,
        lines: billed.lines.map(function (line) {
          return { hsn: line.hsn, gstPercent: line.gstPercent, tax: line.tax };
        })
      },
      'invoice and checkout should agree for order #' + order.id
    );
  }
});
