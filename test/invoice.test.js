const { test } = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('CURRENT BEHAVIOUR: #1001 applies 5% and 12% GST with no coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', price: 1000, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 2, name: 'Ghee', sku: 'GHEE', price: 500, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 1500, discount: 0, tax: 110, total: 1610 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 1500,
    discount: 0,
    tax: 110,
    cgst: 55,
    sgst: 55,
    total: 1610,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 50 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 60 }
    ]
  });
});

test('Invoice applies checkout SAVE10 discount and post-discount GST for #1002', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 3, name: 'Tea', sku: 'TEA', price: 1200, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 1, name: 'Rice', sku: 'RICE', price: 300, qty: 1, hsn: '1006', gstRate: 5 }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 1500, discount: 150, tax: 207.9, total: 1557.9 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 1500,
    discount: 150,
    tax: 207.9,
    cgst: 103.95,
    sgst: 103.95,
    total: 1557.9,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 1200, gstPercent: 18, line: 1200, lineTax: 194.4 },
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 300, gstPercent: 5, line: 300, lineTax: 13.5 }
    ]
  });
});

test('Invoice applies the SAVE10 cap and post-discount GST for #1004', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 4, name: 'Coffee', sku: 'COFFEE', price: 2240, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 376.2, total: 2466.2 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 2240,
    discount: 150,
    tax: 376.2,
    cgst: 188.1,
    sgst: 188.1,
    total: 2466.2,
    rows: [
      { name: 'Coffee', sku: 'COFFEE', hsn: '0901', qty: 1, price: 2240, gstPercent: 18, line: 2240, lineTax: 376.2 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 applies 18% GST and no coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 5, name: 'Coffee blend', sku: 'COFFEE-B', price: 1200, qty: 1, hsn: '0901', gstRate: 18 },
      { id: 6, name: 'Syrup', sku: 'SYRUP', price: 800, qty: 1, hsn: '2106', gstRate: 18 }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { subtotal: 2000, discount: 0, tax: 360, total: 2360 }
  );
  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 2000,
    discount: 0,
    tax: 360,
    cgst: 180,
    sgst: 180,
    total: 2360,
    rows: [
      { name: 'Coffee blend', sku: 'COFFEE-B', hsn: '0901', qty: 1, price: 1200, gstPercent: 18, line: 1200, lineTax: 216 },
      { name: 'Syrup', sku: 'SYRUP', hsn: '2106', qty: 1, price: 800, gstPercent: 18, line: 800, lineTax: 144 }
    ]
  });
});

test('invoice matches checkout for HSN slabs and capped SAVE10 applied before tax', () => {
  const order = {
    id: 1004,
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
