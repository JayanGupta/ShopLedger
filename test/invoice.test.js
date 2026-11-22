'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function characterize(order, expectedInvoice) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  // Evaluate the order ledger calculation on the same item/coupon inputs.
  const ledgerFigures = pricing.computeTotals(order.items, order.coupon);
  assert.ok(ledgerFigures && typeof ledgerFigures.total === 'number');
  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ name, sku, hsn, qty, price, gstPercent, line, lineTax }) =>
      ({ name, sku, hsn, qty, price, gstPercent, line, lineTax }))
  }, expectedInvoice);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the supplied 5% and 12% rates without a coupon', () => {
  characterize({
    id: 1001,
    coupon: '',
    items: [item('Rice', 1000, 1, '1006', 5), item('Ghee', 500, 1, '0405', 12)]
  }, {
    subtotal: 1500,
    discount: 0,
    tax: 110,
    cgst: 55,
    sgst: 55,
    total: 1610,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 50 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 60 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 discount is applied to subtotal before tax', () => {
  characterize({
    id: 1002,
    coupon: 'SAVE10',
    items: [item('Rice', 600, 1, '1006', 5)]
  }, {
    subtotal: 600,
    discount: 60,
    tax: 27,
    cgst: 13.5,
    sgst: 13.5,
    total: 567,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 600, gstPercent: 5, line: 600, lineTax: 27 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 discount uses the ₹150 configured cap before tax', () => {
  characterize({
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Rice', 2000, 1, '1006', 5), item('Ghee', 240, 1, '0405', 12)]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 120.17,
    cgst: 60.09,
    sgst: 60.08,
    total: 2210.17,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 2000, gstPercent: 5, line: 2000, lineTax: 93.3 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 240, gstPercent: 12, line: 240, lineTax: 26.87 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice totals an 18% item without a coupon', () => {
  characterize({
    id: 1008,
    coupon: '',
    items: [item('Coffee', 1000, 1, '0901', 18)]
  }, {
    subtotal: 1000,
    discount: 0,
    tax: 180,
    cgst: 90,
    sgst: 90,
    total: 1180,
    rows: [
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 180 }
    ]
  });
});

test('INVOICE MATCHES CHECKOUT: #1004 uses HSN GST and capped coupon before tax', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(row => ({
      hsn: row.hsn,
      gstPercent: row.gstPercent,
      line: row.line,
      discount: row.discount,
      taxable: row.taxable,
      lineTax: row.lineTax
    }))
  }, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    rows: [{
      hsn: '1508',
      gstPercent: 5,
      line: 2240,
      discount: 150,
      taxable: 2090,
      lineTax: 104.5
    }]
  });
  assert.deepEqual([checkout.subtotal, checkout.discount, checkout.tax, checkout.total], [2240, 150, 104.5, 2194.5]);
  const html = invoice.render(order);
  assert.match(html, /1508/);
  assert.match(html, /5%/);
  assert.match(html, /₹150\.00/);
  assert.match(html, /₹2090\.00/);
  assert.match(html, /₹104\.50/);
  assert.match(html, /₹2194\.50/);
});
