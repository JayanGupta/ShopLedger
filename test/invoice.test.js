'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return {
    id,
    name,
    sku: `SKU-${id}`,
    price,
    qty,
    hsn,
    gstRate
  };
}

function invoiceView(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(({ gstPercent, line, lineTax }) => ({
      gstPercent,
      line,
      lineTax
    }))
  };
}

function pricingView(totals) {
  return {
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    cgst: totals.cgst,
    sgst: totals.sgst,
    total: totals.total,
    lines: totals.lines.map(({ gstPercent, gross, discount, taxable, tax, net }) => ({
      gstPercent,
      gross,
      discount,
      taxable,
      tax,
      net
    }))
  };
}

function assertCurrent(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutTotals = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceView(invoiceFigures), expectedInvoice);
  assert.deepEqual(pricingView(checkoutTotals), expectedPricing);
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% lines without a coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item(2, 'Unpolished Toor Dal 1kg', 165, 2, '0713', 5),
      item(7, 'Pasteurized Table Butter 500g', 260, 1, '0405', 12)
    ]
  };

  assertCurrent(order,
    {
      subtotal: 590,
      discount: 0,
      tax: 47.7,
      cgst: 23.85,
      sgst: 23.85,
      total: 637.7,
      rows: [
        { gstPercent: 5, line: 330, lineTax: 16.5 },
        { gstPercent: 12, line: 260, lineTax: 31.2 }
      ]
    },
    {
      subtotal: 590,
      discount: 0,
      tax: 47.7,
      cgst: 23.85,
      sgst: 23.85,
      total: 637.7,
      lines: [
        { gstPercent: 5, gross: 330, discount: 0, taxable: 330, tax: 16.5, net: 346.5 },
        { gstPercent: 12, gross: 260, discount: 0, taxable: 260, tax: 31.2, net: 291.2 }
      ]
    }
  );
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 is capped and tax uses discounted lines', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item(1, 'Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
      item(4, 'Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
    ]
  };

  assertCurrent(order,
    {
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
    },
    {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      lines: [
        { gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
        { gstPercent: 5, gross: 380, discount: 38, taxable: 342, tax: 17.1, net: 359.1 }
      ]
    }
  );
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 is capped before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
    ]
  };

  assertCurrent(order,
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      lines: [
        { gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
      ]
    }
  );
});

test('CURRENT BEHAVIOUR: #1008 all 18% lines without a coupon match checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item(8, 'Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
      item(12, 'Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
    ]
  };

  assertCurrent(order,
    {
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
    },
    {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      lines: [
        { gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
        { gstPercent: 18, gross: 360, discount: 0, taxable: 360, tax: 64.8, net: 424.8 }
      ]
    }
  );
});

test('invoice matches checkout for HSN-only items with capped SAVE10', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      {
        id: 5,
        name: 'Cold-Pressed Groundnut Oil 5L',
        sku: 'SKU-5',
        price: 1120,
        qty: 2,
        hsn: '1508'
      }
    ]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutTotals = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceView(invoiceFigures), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepEqual(pricingView(checkoutTotals), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    lines: [
      { gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
    ]
  });
});
