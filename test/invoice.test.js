const { test } = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('Invoice matches 5% and 12% HSN slabs for #1001', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', price: 90, qty: 1, hsn: '1006' },
      { id: 2, name: 'Ghee', sku: 'GHEE', price: 520, qty: 1, hsn: '0405' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 90, gstPercent: 5, line: 90, lineTax: 4.5 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 520, gstPercent: 12, line: 520, lineTax: 62.4 }
    ]
  });
});

test('Invoice applies checkout SAVE10 discount and post-discount GST for #1002', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', price: 1020, qty: 1, hsn: '1006' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 1020, gstPercent: 5, line: 1020, lineTax: 45.9 }
    ]
  });
});

test('Invoice applies the SAVE10 cap and post-discount GST for #1004', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', price: 2240, qty: 1, hsn: '1006' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 2240, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 applies 18% GST and no coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 5, name: 'Tea', sku: 'TEA', price: 500, qty: 1, hsn: '0902' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 500, gstPercent: 18, line: 500, lineTax: 90 }
    ]
  });
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10 before tax', () => {
  const order = {
    id: 1010,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', price: 1000, qty: 1, hsn: '1006' },
      { id: 2, name: 'Ghee', sku: 'GHEE', price: 500, qty: 1, hsn: '0405' },
      { id: 3, name: 'Spices', sku: 'SPICE', price: 740, qty: 1, hsn: '0904' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 185.48, cgst: 92.74, sgst: 92.74, total: 2275.48 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 2240,
    discount: 150,
    tax: 185.48,
    cgst: 92.74,
    sgst: 92.74,
    total: 2275.48,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 46.65 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 55.98 },
      { name: 'Spices', sku: 'SPICE', hsn: '0904', qty: 1, price: 740, gstPercent: 12, line: 740, lineTax: 82.85 }
    ]
  });
});
