'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function makeOrder(overrides) {
  const items = overrides && overrides.items ? overrides.items : [
    { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 640, qty: 1 }
  ];
  const totals = pricing.computeTotals(items, (overrides && overrides.coupon) || '');

  return Object.assign({
    id: 1,
    date: '21/11/2026',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items,
    coupon: '',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  }, overrides || {});
}

test('invoice figures match the billed GST breakdown for an HSN-rated order', function () {
  const order = makeOrder();
  const billed = pricing.computeTotals(order.items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(invoiceFigures.subtotal, billed.subtotal);
  assert.equal(invoiceFigures.discount, billed.discount);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.equal(invoiceFigures.cgst, billed.cgst);
  assert.equal(invoiceFigures.sgst, billed.sgst);
  assert.equal(invoiceFigures.total, billed.total);
  assert.equal(invoiceFigures.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(invoiceFigures.rows[0].lineTax, billed.lines[0].tax);
});

test('invoice uses the HSN slab instead of falling back to the default rate', function () {
  const order = makeOrder();
  const billed = pricing.computeTotals(order.items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 32);
  assert.equal(billed.total, 672);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.tax, 32);
  assert.equal(invoiceFigures.total, 672);
});

test('invoice applies the same capped subtotal coupon and post-discount tax as pricing', function () {
  const items = [
    { id: 2, name: 'Ghee', sku: 'GHEE-1', hsn: '0405', gstRate: 5, price: 2000, qty: 1 }
  ];
  const order = makeOrder({ items, coupon: 'SAVE10' });
  const billed = pricing.computeTotals(items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 92.5);
  assert.equal(billed.total, 1942.5);
  assert.equal(invoiceFigures.discount, 150);
  assert.equal(invoiceFigures.tax, 92.5);
  assert.equal(invoiceFigures.total, 1942.5);
});

test('invoice line GST uses the same discounted taxable value as pricing', function () {
  const items = [
    { id: 2, name: 'Ghee', sku: 'GHEE-1', hsn: '0405', gstRate: 5, price: 2000, qty: 1 }
  ];
  const order = makeOrder({ items, coupon: 'SAVE10' });
  const billed = pricing.computeTotals(items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.lines[0].taxable, 1850);
  assert.equal(billed.lines[0].tax, 92.5);
  assert.equal(invoiceFigures.rows[0].line, 2000);
  assert.equal(invoiceFigures.rows[0].lineTax, 92.5);
});

test('rendered invoice total matches the billed total without a reconciliation warning', function () {
  const order = makeOrder({
    items: [{ id: 2, name: 'Ghee', sku: 'GHEE-1', hsn: '0405', gstRate: 5, price: 2000, qty: 1 }],
    coupon: 'SAVE10'
  });
  const html = invoice.render(order);

  assert.match(html, /Invoice Total<\/td><td class="r">₹1942\.50/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
