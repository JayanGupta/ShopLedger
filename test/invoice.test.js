'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Keep this helper in-memory: these fixtures mirror the relevant order fields
// but never load or mutate the application JSON store.
function makeOrder(id, coupon, items) {
  return {
    id,
    coupon,
    items: items.map((item) => ({
      name: item.name,
      sku: item.sku,
      price: item.price,
      qty: item.qty,
      hsn: item.hsn,
      gstRate: item.gstRate
    }))
  };
}

function assertCurrentCalculations(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(checkoutFigures, expectedCheckout);
}

test('CURRENT BEHAVIOUR: order #1001 mixed 5% and 12% slabs without coupon', () => {
  const order = makeOrder(1001, '', [
    { name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
    { name: 'Ghee', sku: 'DRY-001', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
  ]);

  assertCurrentCalculations(order, {
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
    total: 1176,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 640, discount: 0, taxable: 640, tax: 32, net: 672 },
      { id: undefined, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 450, discount: 0, taxable: 450, tax: 54, net: 504 }
    ]
  });
});

test('CURRENT BEHAVIOUR: order #1002 SAVE10 invoice matches checkout discount and GST', () => {
  const order = makeOrder(1002, 'SAVE10', [
    { name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
    { name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: 18 }
  ]);

  assertCurrentCalculations(order, {
    subtotal: 780,
    discount: 78,
    tax: 51.48,
    cgst: 25.74,
    sgst: 25.74,
    total: 753.48,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 22.68 }
    ]
  }, {
    subtotal: 780,
    discount: 78,
    taxable: 702,
    tax: 51.48,
    cgst: 25.74,
    sgst: 25.74,
    total: 753.48,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
      { id: undefined, name: 'Tea', hsn: '0902', gstPercent: 18, gross: 140, discount: 14, taxable: 126, tax: 22.68, net: 148.68 }
    ]
  });
});

test('CURRENT BEHAVIOUR: order #1004 SAVE10 cap is applied before invoice GST', () => {
  const order = makeOrder(1004, 'SAVE10', [
    { name: 'Groundnut Oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
  ]);

  assertCurrentCalculations(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    lines: [
      { id: undefined, name: 'Groundnut Oil', hsn: '1508', gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: order #1008 all 18% slabs without coupon', () => {
  const order = makeOrder(1008, '', [
    { name: 'Tea', sku: 'BEV-001', price: 140, qty: 2, hsn: '0902', gstRate: 18 },
    { name: 'Coffee', sku: 'BEV-002', price: 120, qty: 1, hsn: '0901', gstRate: 18 }
  ]);

  assertCurrentCalculations(order, {
    subtotal: 400,
    discount: 0,
    tax: 72,
    cgst: 36,
    sgst: 36,
    total: 472,
    rows: [
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Coffee', sku: 'BEV-002', hsn: '0901', qty: 1, price: 120, gstPercent: 18, line: 120, lineTax: 21.6 }
    ]
  }, {
    subtotal: 400,
    discount: 0,
    taxable: 400,
    tax: 72,
    cgst: 36,
    sgst: 36,
    total: 472,
    lines: [
      { id: undefined, name: 'Tea', hsn: '0902', gstPercent: 18, gross: 280, discount: 0, taxable: 280, tax: 50.4, net: 330.4 },
      { id: undefined, name: 'Coffee', hsn: '0901', gstPercent: 18, gross: 120, discount: 0, taxable: 120, tax: 21.6, net: 141.6 }
    ]
  });
});




test('INVOICE matches checkout: HSN slab and capped coupon are applied before GST', () => {
  const order = makeOrder(1004, 'SAVE10', [
    // Checkout order items store the HSN; the tax slab is resolved from config.
    { name: 'Groundnut Oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508' }
  ]);
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total
  });
  assert.deepEqual(invoiceFigures.rows.map((row) => ({
    hsn: row.hsn,
    gstPercent: row.gstPercent,
    line: row.line,
    lineTax: row.lineTax
  })), checkoutFigures.lines.map((line) => ({
    hsn: line.hsn,
    gstPercent: line.gstPercent,
    line: line.gross,
    lineTax: line.tax
  })));
});
