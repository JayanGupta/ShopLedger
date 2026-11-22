var test = require('node:test');
var assert = require('node:assert').strict;
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// Synthetic orders only: never load the store or the persisted database.
// Explicit gstRate values are percentages (5, 12, 18), not decimal rates.
// The #1001-style case deliberately uses the requested 5% and 12% mix.
var mixedSlabOrder = {
  id: 1001,
  coupon: '',
  items: [
    { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
    { id: 6, name: 'Ghee', sku: 'DRY-001', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
  ]
};

// Literal expectations characterize today's results, including discrepancies.
// Both functions receive the very same items and coupon; neither result is
// used to generate the other function's expected figures.
function assertCurrentFigures(order, expectedInvoice, expectedCheckout) {
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice, 'current invoice figures and every displayed row');
  assert.deepEqual({
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    taxable: checkout.taxable,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  }, expectedCheckout, 'current checkout totals for the identical cart');
}

test('CURRENT BEHAVIOUR: #1001-style explicit 5% and 12%, no coupon', function () {
  assertCurrentFigures(mixedSlabOrder, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090,
    discount: 0,
    taxable: 1090,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('invoice matches checkout GST and discount for #1002 SAVE10', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 4, name: 'Sunflower oil', sku: 'OIL-001', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };

  // Invoice uses the same pre-tax discount and discounted GST as checkout.
  assertCurrentFigures(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020,
    discount: 102,
    taxable: 918,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
});

test('invoice applies the Rs 150 SAVE10 cap for #1004', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };

  // Both paths cap the discount at 150 and tax the remaining 2090.
  assertCurrentFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all 18%, no coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 8, name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 12, name: 'Kokum concentrate', sku: 'BEV-003', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };

  assertCurrentFigures(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum concentrate', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500,
    discount: 0,
    taxable: 500,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590
  });
});

test('invoice resolves 5% and 12% HSN slabs when gstRate is missing', function () {
  var order = {
    id: 1001,
    coupon: mixedSlabOrder.coupon,
    items: mixedSlabOrder.items.map(function (item) {
      var copy = Object.assign({}, item);
      delete copy.gstRate;
      return copy;
    })
  };

  // Without gstRate, invoice resolves the HSN slabs just as checkout does.
  assertCurrentFigures(order, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090,
    discount: 0,
    taxable: 1090,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('invoice matches billed totals and GST breakdown for a capped mixed-slab order', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 2, hsn: '1006' },
      { id: 6, name: 'Ghee', sku: 'DRY-001', price: 450, qty: 2, hsn: '0405' }
    ]
  };
  var checkout = pricing.computeTotals(order.items, order.coupon);
  var expectedTotals = {
    subtotal: 2180,
    discount: 150,
    tax: 160.17,
    cgst: 80.09,
    sgst: 80.08,
    total: 2190.17
  };

  // Pin the billed amounts independently of the invoice's implementation.
  var billedTotals = {};
  Object.keys(expectedTotals).forEach(function (key) {
    billedTotals[key] = checkout[key];
  });
  assert.deepEqual(billedTotals, expectedTotals);

  var figures = invoice.computeInvoiceFigures(order);
  assert.deepEqual(figures, Object.assign({}, expectedTotals, {
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 2, price: 640, gstPercent: 5, line: 1280, lineTax: 59.6 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 2, price: 450, gstPercent: 12, line: 900, lineTax: 100.57 }
    ]
  }), 'invoice must match checkout, including post-discount GST and the capped coupon');
});
