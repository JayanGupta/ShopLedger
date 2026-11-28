'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('Invoice total and GST breakdown match the billed HSN-priced coupon order', function () {
  const items = [{
    id: 10,
    sku: 'GRN-001',
    name: 'Rice',
    hsn: '1006',
    price: 1000,
    qty: 1
  }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const invoiced = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual({
    subtotal: invoiced.subtotal,
    discount: invoiced.discount,
    tax: invoiced.tax,
    cgst: invoiced.cgst,
    sgst: invoiced.sgst,
    total: invoiced.total
  }, {
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total
  });
  assert.equal(invoiced.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(invoiced.rows[0].lineTax, billed.lines[0].tax);
});

test('Invoice uses the same HSN GST slab and split as billing', function () {
  const items = [{
    id: 1,
    sku: 'GRN-001',
    name: 'Rice',
    hsn: '1006',
    price: 1000,
    qty: 1
  }];
  const billed = pricing.computeTotals(items, '');
  const invoiced = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.equal(billed.tax, 50);
  assert.equal(billed.cgst, 25);
  assert.equal(billed.sgst, 25);
  assert.equal(billed.total, 1050);

  assert.equal(invoiced.rows[0].gstPercent, 5);
  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.cgst, billed.cgst);
  assert.equal(invoiced.sgst, billed.sgst);
  assert.equal(invoiced.total, billed.total);
});

test('Invoice applies the same coupon discount cap and post-discount tax as billing', function () {
  const items = [{
    id: 2,
    sku: 'GST-005',
    name: 'Taxable item',
    hsn: '1006',
    gstRate: 5,
    price: 3000,
    qty: 1
  }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const invoiced = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 142.5);
  assert.equal(billed.total, 2992.5);

  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.discount, billed.discount);
  assert.equal(invoiced.total, billed.total);
});

test('Invoice line rows show billing discount allocation, taxable amount, and GST', function () {
  const items = [{
    id: 3,
    sku: 'GST-005',
    name: 'Taxable item',
    hsn: '1006',
    gstRate: 5,
    price: 500,
    qty: 1
  }];
  const billed = pricing.computeTotals(items, 'FLAT50');
  const invoiced = invoice.computeInvoiceFigures({ items: items, coupon: 'FLAT50' });
  const html = invoice.render({
    id: 77,
    date: '28/11/2026',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items: items,
    coupon: 'FLAT50',
    total: billed.total
  });

  assert.deepEqual(billed.lines[0], {
    id: 3,
    name: 'Taxable item',
    hsn: '1006',
    gstPercent: 5,
    gross: 500,
    discount: 50,
    taxable: 450,
    tax: 22.5,
    net: 472.5
  });
  assert.equal(invoiced.rows[0].line, 500);
  assert.equal(invoiced.rows[0].lineDiscount, billed.lines[0].discount);
  assert.equal(invoiced.rows[0].taxable, billed.lines[0].taxable);
  assert.equal(invoiced.rows[0].lineTax, billed.lines[0].tax);
  assert.equal(invoiced.rows[0].gstPercent, 5);
  assert.equal(invoiced.total, billed.total);
  assert.equal(html.includes('CGST</td>'), true);
  assert.equal(html.includes('SGST</td>'), true);
  assert.equal(html.includes('Accountant Reconciliation Notice:'), false);
});
