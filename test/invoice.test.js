'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/\s+/g, '-'), price, qty, hsn, gstRate };
}

function characterize(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total,
      lines: checkoutFigures.lines.map(({ gstPercent, tax }) => ({ gstPercent, tax }))
    },
    expectedCheckout
  );
  return { invoiceFigures, checkoutFigures };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses explicit 5% and 12% gstRate values without coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Rice', 100, 1, '1006', 5),
      item('Ghee', 100, 1, '0405', 12)
    ]
  };
  characterize(order, {
    subtotal: 200,
    discount: 0,
    tax: 17,
    cgst: 8.5,
    sgst: 8.5,
    total: 217,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 100, gstPercent: 5, line: 100, lineTax: 5 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 100, gstPercent: 12, line: 100, lineTax: 12 }
    ]
  }, {
    subtotal: 200, discount: 0, tax: 17, total: 217,
    lines: [{ gstPercent: 5, tax: 5 }, { gstPercent: 12, tax: 12 }]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before calculating GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [item('Tea', 1000, 1, '0902', 18)]
  };
  characterize(order, {
    subtotal: 1000,
    discount: 100,
    tax: 162,
    cgst: 81,
    sgst: 81,
    total: 1062,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 162 }
    ]
  }, {
    subtotal: 1000, discount: 100, tax: 162, total: 1062,
    lines: [{ gstPercent: 18, tax: 162 }]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies SAVE10 cap before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Syrup', 2240, 1, '2106', 18)]
  };
  characterize(order, {
    subtotal: 2240,
    discount: 150,
    tax: 376.2,
    cgst: 188.1,
    sgst: 188.1,
    total: 2466.2,
    rows: [
      { name: 'Syrup', sku: 'SYRUP', hsn: '2106', qty: 1, price: 2240, gstPercent: 18, line: 2240, lineTax: 376.2 }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 376.2, total: 2466.2,
    lines: [{ gstPercent: 18, tax: 376.2 }]
  });
});

test('CURRENT BEHAVIOUR: #1008 no-coupon 18% invoice figures match checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [item('Coffee', 500, 2, '0901', 18)]
  };
  characterize(order, {
    subtotal: 1000,
    discount: 0,
    tax: 180,
    cgst: 90,
    sgst: 90,
    total: 1180,
    rows: [
      { name: 'Coffee', sku: 'COFFEE', hsn: '0901', qty: 2, price: 500, gstPercent: 18, line: 1000, lineTax: 180 }
    ]
  }, {
    subtotal: 1000, discount: 0, tax: 180, total: 1180,
    lines: [{ gstPercent: 18, tax: 180 }]
  });
});

test('CORRECT BEHAVIOUR: #1004 invoice matches checkout HSN slab and capped pre-tax coupon', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ]
  };
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      {
        name: 'Cold-Pressed Groundnut Oil 5L',
        sku: 'OIL-002',
        hsn: '1508',
        qty: 2,
        price: 1120,
        gstPercent: 5,
        line: 2240,
        lineTax: 104.5
      }
    ]
  });
  assert.equal(invoiceFigures.subtotal, checkoutFigures.subtotal);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});
