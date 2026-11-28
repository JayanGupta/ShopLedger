'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rows: invoiceFigures.rows.map(({ gstPercent, line: amount, lineTax }) => ({
        gstPercent,
        line: amount,
        lineTax
      }))
    },
    expectedInvoice
  );

  // Keep checkout figures alongside the invoice characterization so differences stay explicit.
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    },
    expectedCheckout
  );
}

test('CURRENT BEHAVIOUR: Order #1001 mixed 5% and 12% items without a coupon', () => {
  const order = {
    items: [
      line('Rice', 140, 2, '1006', 5),
      line('Ghee', 165, 2, '0405', 12)
    ],
    coupon: ''
  };

  assertFigures(order, {
    subtotal: 610,
    discount: 0,
    tax: 53.6,
    cgst: 26.8,
    sgst: 26.8,
    total: 663.6,
    rows: [
      { gstPercent: 5, line: 280, lineTax: 14 },
      { gstPercent: 12, line: 330, lineTax: 39.6 }
    ]
  }, {
    subtotal: 610,
    discount: 0,
    tax: 53.6,
    total: 663.6
  });
});

test('CURRENT BEHAVIOUR: Order #1002 SAVE10 discounts the taxable subtotal at checkout', () => {
  const order = {
    items: [
      line('Rice', 640, 1, '1006', 5),
      line('Sunflower oil', 190, 2, '1512', 5)
    ],
    coupon: 'SAVE10'
  };

  assertFigures(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.8 },
      { gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9
  });
});

test('CURRENT BEHAVIOUR: Order #1004 SAVE10 invoice applies the ₹150 cap before tax', () => {
  const order = {
    items: [line('Groundnut oil', 1120, 2, '1508', 5)],
    coupon: 'SAVE10'
  };

  assertFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [{ gstPercent: 5, line: 2240, lineTax: 104.5 }]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: Order #1008 all 18% items without a coupon', () => {
  const order = {
    items: [
      line('Packaged tea', 140, 1, '0902', 18),
      line('Kokum concentrate', 180, 2, '2106', 18)
    ],
    coupon: ''
  };

  assertFigures(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { gstPercent: 18, line: 140, lineTax: 25.2 },
      { gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    total: 590
  });
});

test('invoice matches checkout HSN slabs and capped pre-tax coupon discount', () => {
  const order = {
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 1, hsn: '1508' },
      { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
    ],
    coupon: 'SAVE10'
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rows: invoiceFigures.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }))
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total,
      rows: checkout.lines.map(({ gstPercent, tax }) => ({ gstPercent, lineTax: tax }))
    }
  );
  assert.equal(invoiceFigures.discount, 150);
  assert.equal(invoiceFigures.tax, 177.65);
  assert.equal(invoiceFigures.total, 2267.65);
});
