var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function totalsOnly(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

test('CURRENT BEHAVIOUR: #1001 no coupon uses explicit 12% and 5% rates and matches checkout', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 8, sku: 'BEV-001', name: '12% item', price: 140, qty: 2, hsn: '0405', gstRate: 12 },
      { id: 2, sku: 'GRN-002', name: '5% item', price: 165, qty: 2, hsn: '0713', gstRate: 5 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 610,
    discount: 0,
    tax: 50.1,
    cgst: 25.05,
    sgst: 25.05,
    total: 660.1,
    rows: [
      { name: '12% item', sku: 'BEV-001', hsn: '0405', qty: 2, price: 140, gstPercent: 12, line: 280, lineTax: 33.6 },
      { name: '5% item', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.deepStrictEqual(totalsOnly(checkoutFigures), totalsOnly(invoiceFigures));
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 applies discount before GST and invoice matches checkout', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, sku: 'GRN-001', name: 'Rice 5kg', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 4, sku: 'OIL-001', name: 'Sunflower Oil 1L', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.deepStrictEqual(totalsOnly(checkoutFigures), {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 enforces the 150 rupee cap and invoice matches checkout', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, sku: 'OIL-002', name: 'Groundnut Oil 5L', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepStrictEqual(totalsOnly(checkoutFigures), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all 18% with no coupon matches checkout', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 8, sku: 'BEV-001', name: 'Tea 250g', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 12, sku: 'BEV-003', name: 'Kokum Concentrate', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Tea 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Concentrate', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.deepStrictEqual(totalsOnly(checkoutFigures), totalsOnly(invoiceFigures));
});

test('invoice matches checkout for HSN GST and a capped coupon', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, sku: 'OIL-002', name: 'Groundnut Oil 5L', price: 1120, qty: 2, hsn: '1508' }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(totalsOnly(invoiceFigures), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
  assert.deepStrictEqual(invoiceFigures.rows, [
    {
      name: 'Groundnut Oil 5L',
      sku: 'OIL-002',
      hsn: '1508',
      qty: 2,
      price: 1120,
      gstPercent: 5,
      line: 2240,
      lineTax: 104.5
    }
  ]);
  assert.deepStrictEqual(totalsOnly(invoiceFigures), totalsOnly(checkoutFigures));
});
