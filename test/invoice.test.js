'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/ /g, '-'), price, qty, hsn, gstRate };
}

function order(id, coupon, items) {
  return { id, coupon, items };
}

test('INVOICE SHOULD MATCH CHECKOUT: resolve HSN and apply SAVE10 cap before GST', function () {
  const items = [
    { name: 'Groundnut Oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508' }
  ];
  const code = 'SAVE10';
  const figures = invoice.computeInvoiceFigures(order(1004, code, items));
  const checkout = pricing.computeTotals(items, code);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total,
      rows: figures.rows.map(function (row) {
        return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
      })
    },
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [{ gstPercent: 5, line: 2240, lineTax: 104.5 }]
    }
  );
  assert.deepEqual(
    { subtotal: figures.subtotal, discount: figures.discount, tax: figures.tax, total: figures.total },
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total }
  );
});

test('CURRENT BEHAVIOUR: order #1001 no-coupon mixed 5% and 12% GST', function () {
  const items = [
    item('Toor Dal', 165, 2, '0713', 5),
    item('Ghee', 450, 1, '0405', 12)
  ];
  const code = '';
  const figures = invoice.computeInvoiceFigures(order(1001, code, items));
  const checkout = pricing.computeTotals(items, code);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total,
      rows: figures.rows.map(function (row) {
        return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
      })
    },
    {
      subtotal: 780,
      discount: 0,
      tax: 70.5,
      cgst: 35.25,
      sgst: 35.25,
      total: 850.5,
      rows: [
        { gstPercent: 5, line: 330, lineTax: 16.5 },
        { gstPercent: 12, line: 450, lineTax: 54 }
      ]
    }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 780, discount: 0, tax: 70.5, total: 850.5 }
  );
});

test('CHECKOUT MATCH: order #1002 SAVE10 uses discounted taxable lines', function () {
  const items = [
    item('Masala Chai', 140, 2, '0902', 18),
    item('Toor Dal', 165, 2, '0713', 5)
  ];
  const code = 'SAVE10';
  const figures = invoice.computeInvoiceFigures(order(1002, code, items));
  const checkout = pricing.computeTotals(items, code);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    { subtotal: 610, discount: 61, tax: 60.21, cgst: 30.11, sgst: 30.1, total: 609.21 }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 610, discount: 61, tax: 60.21, total: 609.21 }
  );
});

test('CHECKOUT MATCH: order #1004 SAVE10 applies the ₹150 cap before GST', function () {
  const items = [item('Packaged Tea', 2240, 1, '0902', 18)];
  const code = 'SAVE10';
  const figures = invoice.computeInvoiceFigures(order(1004, code, items));
  const checkout = pricing.computeTotals(items, code);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total,
      row: figures.rows.map(function (row) {
        return { gstPercent: row.gstPercent, lineTax: row.lineTax };
      })
    },
    {
      subtotal: 2240,
      discount: 150,
      tax: 376.2,
      cgst: 188.1,
      sgst: 188.1,
      total: 2466.2,
      row: [{ gstPercent: 18, lineTax: 376.2 }]
    }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 376.2, total: 2466.2 }
  );
});

test('CURRENT BEHAVIOUR: order #1008 no-coupon all-18% GST agrees with checkout', function () {
  const items = [
    item('Coffee Blend', 310, 1, '0901', 18),
    item('Sherbet Concentrate', 180, 1, '2106', 18)
  ];
  const code = '';
  const figures = invoice.computeInvoiceFigures(order(1008, code, items));
  const checkout = pricing.computeTotals(items, code);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total,
      rows: figures.rows.map(function (row) {
        return { gstPercent: row.gstPercent, lineTax: row.lineTax };
      })
    },
    {
      subtotal: 490,
      discount: 0,
      tax: 88.2,
      cgst: 44.1,
      sgst: 44.1,
      total: 578.2,
      rows: [
        { gstPercent: 18, lineTax: 55.8 },
        { gstPercent: 18, lineTax: 32.4 }
      ]
    }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 490, discount: 0, tax: 88.2, total: 578.2 }
  );
});
