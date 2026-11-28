'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// gstRate is expressed as a percentage in invoice line items. These fixtures
// carry both hsn and gstRate so both calculators receive their expected fields.
function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function compareCalculators(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: mixed 5% and 12% order without a coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
      item('A2 Gir Cow Ghee 500ml', 450, 1, '0405', 12)
    ]
  };
  const { invoice: actual, checkout } = compareCalculators(order);

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax,
      cgst: actual.cgst, sgst: actual.sgst, total: actual.total,
      slabs: actual.rows.map((row) => row.gstPercent) },
    { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43,
      total: 1176, slabs: [5, 12] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount,
      tax: checkout.tax, total: checkout.total },
    { subtotal: 1090, discount: 0, tax: 86, total: 1176 }
  );
});

test('CURRENT BEHAVIOUR: SAVE10 discount is based on subtotal plus GST on a 5% order', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
      item('Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
    ]
  };
  const { invoice: actual, checkout } = compareCalculators(order);

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax,
      cgst: actual.cgst, sgst: actual.sgst, total: actual.total,
      slabs: actual.rows.map((row) => row.gstPercent) },
    { subtotal: 1020, discount: 107.1, tax: 51, cgst: 25.5, sgst: 25.5,
      total: 963.9, slabs: [5, 5] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount,
      tax: checkout.tax, total: checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: SAVE10 invoice discount ignores the ₹150 cap on a ₹2,240 order', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)]
  };
  const { invoice: actual, checkout } = compareCalculators(order);

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax,
      cgst: actual.cgst, sgst: actual.sgst, total: actual.total,
      slabs: actual.rows.map((row) => row.gstPercent) },
    { subtotal: 2240, discount: 235.2, tax: 112, cgst: 56, sgst: 56,
      total: 2116.8, slabs: [5] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount,
      tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: no-coupon order entirely in the 18% slab', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
      item('Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
    ]
  };
  const { invoice: actual, checkout } = compareCalculators(order);

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax,
      cgst: actual.cgst, sgst: actual.sgst, total: actual.total,
      slabs: actual.rows.map((row) => row.gstPercent) },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45,
      total: 590, slabs: [18, 18] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount,
      tax: checkout.tax, total: checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});
