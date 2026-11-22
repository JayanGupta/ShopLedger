'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const config = require('../config');

// These fixtures use only in-memory order/item values and exercise HSN-based GST.
const cases = [
  {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Toor dal', sku: 'GRN-002', hsn: '0713', gstRate: 5, price: 165, qty: 2 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ],
    expectedCheckout: { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5, gstPercents: [5, 12], lineGrosses: [330, 450], lineTaxes: [16.5, 54] }
  },
  {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ],
    expectedCheckout: { subtotal: 1090, discount: 109, tax: 77.4, cgst: 38.7, sgst: 38.7, total: 1058.4, gstPercents: [5, 12], lineGrosses: [640, 450], lineTaxes: [28.8, 48.6] }
  },
  {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ],
    expectedCheckout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercents: [5], lineGrosses: [2240], lineTaxes: [104.5] }
  },
  {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { name: 'Coffee', sku: 'BEV-002', hsn: '0901', gstRate: 18, price: 310, qty: 1 },
      { name: 'Sherbet', sku: 'BEV-003', hsn: '2106', gstRate: 18, price: 180, qty: 1 }
    ],
    expectedCheckout: { subtotal: 630, discount: 0, tax: 113.4, cgst: 56.7, sgst: 56.7, total: 743.4, gstPercents: [18, 18, 18], lineGrosses: [140, 310, 180], lineTaxes: [25.2, 55.8, 32.4] }
  }
];

for (const orderCase of cases) {
  test(`Invoice matches checkout for order #${orderCase.id} with ${orderCase.coupon || 'no coupon'}`, () => {
    const order = { id: orderCase.id, coupon: orderCase.coupon, items: orderCase.items };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(orderCase.items, orderCase.coupon);

    assert.deepEqual({
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      gstPercents: checkoutFigures.lines.map(line => line.gstPercent),
      lineGrosses: checkoutFigures.lines.map(line => line.gross),
      lineTaxes: checkoutFigures.lines.map(line => line.tax)
    }, orderCase.expectedCheckout);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercents: invoiceFigures.rows.map(row => row.gstPercent),
      lineGrosses: invoiceFigures.rows.map(row => row.line),
      lineTaxes: invoiceFigures.rows.map(row => row.lineTax)
    }, orderCase.expectedCheckout);
  });
}

test('Invoice uses the HSN slab and billed totals when stored lines omit gstRate', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    total: 2194.5,
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual({
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: order.total
  });
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  }, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  });
});

test('Invoice preserves recorded discount after coupon is deactivated', () => {
  const order = {
    id: 1010,
    coupon: 'DIWALI20',
    subtotal: 2240,
    discount: 250,
    tax: 99.5,
    total: 2089.5,
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', gstRate: 0.05, price: 1120, qty: 2 }
    ]
  };
  const currentCheckout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(currentCheckout.discount, 0);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 99.5);
  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  }, {
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    cgst: 49.75,
    sgst: 49.75,
    total: order.total
  });
});

test('Invoice line GST amounts reconcile to recorded tax when the current slab changes', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ]
  };
  const originalSlab = config.tax.hsnSlabs['1508'];
  try {
    config.tax.hsnSlabs['1508'] = 18;
    const figures = invoice.computeInvoiceFigures(order);
    assert.equal(figures.rows[0].gstPercent, null);
    assert.equal(figures.rows.reduce((sum, row) => sum + row.lineTax, 0), order.tax);
    assert.equal(figures.tax, order.tax);
    assert.equal(figures.total, order.total);
    assert.ok(invoice.render(order).includes('<td class="r">Not recorded</td>'));
  } finally {
    config.tax.hsnSlabs['1508'] = originalSlab;
  }
});

test('Invoice preserves checkout-time GST rate after HSN slab changes', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', gstRate: 0.05, price: 1120, qty: 2 }
    ]
  };
  const originalSlab = config.tax.hsnSlabs['1508'];
  try {
    config.tax.hsnSlabs['1508'] = 18;
    const figures = invoice.computeInvoiceFigures(order);
    assert.equal(figures.rows[0].gstPercent, 5);
    assert.equal(figures.rows[0].lineTax, 104.5);
    assert.equal(figures.tax, order.tax);
    assert.equal(figures.total, order.total);
  } finally {
    config.tax.hsnSlabs['1508'] = originalSlab;
  }
});
