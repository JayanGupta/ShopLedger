'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, price, qty, hsn) {
  // Saved orders from this app carry HSN but no gstRate; keep that shape explicit.
  return { name, sku, price, qty, hsn, gstRate: undefined };
}

function figures(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

function invoiceSummary(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total,
    rows: result.rows.map((row) => ({
      hsn: row.hsn,
      gstPercent: row.gstPercent,
      line: row.line,
      lineTax: row.lineTax
    }))
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses each HSN GST slab without gstRate', () => {
  const order = {
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', 140, 2, '0902'),
      item('Unpolished Toor Dal 1kg', 'GRN-002', 165, 2, '0713')
    ]
  };
  const { invoice: result, checkout } = figures(order);

  assert.deepEqual(invoiceSummary(result), {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 280, lineTax: 50.4 },
      { hsn: '0713', gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  );
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice uses HSN rates and pre-tax discount', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', 640, 1, '1006'),
      item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', 190, 2, '1512')
    ]
  };
  const { invoice: result, checkout } = figures(order);

  assert.deepEqual(invoiceSummary(result), {
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
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the maxDiscount cap before tax', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', 1120, 2, '1508')
    ]
  };
  const { invoice: result, checkout } = figures(order);

  assert.deepEqual(invoiceSummary(result), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree for 18% HSN items without coupon', () => {
  const order = {
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', 140, 1, '0902'),
      item('Kokum Sherbet Concentrate 750ml', 'BEV-003', 180, 2, '2106')
    ]
  };
  const { invoice: result, checkout } = figures(order);

  assert.deepEqual(invoiceSummary(result), {
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
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});

test('invoice matches checkout HSN rates and capped pre-tax coupon discount', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', 640, 1, '1006'),
      item('A2 Gir Cow Ghee 500ml', 'DRY-001', 450, 1, '0405'),
      item('Filter Coffee Decoction Blend 500g', 'BEV-002', 310, 1, '0901'),
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', 1120, 2, '1508')
    ]
  };
  const { invoice: result, checkout } = figures(order);

  assert.deepEqual(invoiceSummary(result), {
    subtotal: 3640,
    discount: 150,
    tax: 243.34,
    cgst: 121.67,
    sgst: 121.67,
    total: 3733.34,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 30.68 },
      { hsn: '0405', gstPercent: 12, line: 450, lineTax: 51.78 },
      { hsn: '0901', gstPercent: 18, line: 310, lineTax: 53.5 },
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 107.38 }
    ]
  });
  assert.deepEqual(
    { subtotal: result.subtotal, discount: result.discount, tax: result.tax, total: result.total },
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total }
  );
});
