'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, sku, name, hsn, price, qty) {
  return { id, sku, name, hsn, gstRate: null, price, qty };
}

function checkOrder(order, expectedInvoice, expectedCheckout) {
  const invoiceResult = invoice.computeInvoiceFigures(order);
  const checkoutResult = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceResult, expectedInvoice);
  assert.equal(checkoutResult.subtotal, expectedCheckout.subtotal);
  assert.equal(checkoutResult.discount, expectedCheckout.discount);
  assert.equal(checkoutResult.tax, expectedCheckout.tax);
  assert.equal(checkoutResult.total, expectedCheckout.total);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% dal and 12% ghee HSN slabs', function () {
  const order = {
    coupon: '',
    items: [
      item(2, 'GRN-002', 'Unpolished Toor Dal 1kg', '0713', 165, 2),
      item(6, 'DRY-001', 'A2 Gir Cow Ghee 500ml', '0405', 450, 1)
    ]
  };

  checkOrder(order, {
    subtotal: 780,
    discount: 0,
    tax: 70.5,
    cgst: 35.25,
    sgst: 35.25,
    total: 850.5,
    rows: [
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'A2 Gir Cow Ghee 500ml', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, { subtotal: 780, discount: 0, tax: 70.5, total: 850.5 });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before tax using HSN slabs', function () {
  const order = {
    coupon: 'SAVE10',
    items: [
      item(1, 'GRN-001', 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
      item(4, 'OIL-001', 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
    ]
  };

  checkOrder(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies SAVE10 ₹150 cap before tax', function () {
  const order = {
    coupon: 'SAVE10',
    items: [
      item(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
    ]
  };

  checkOrder(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout when all lines use the 18% default', function () {
  const order = {
    coupon: '',
    items: [
      item(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 140, 1),
      item(12, 'BEV-003', 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
    ]
  };

  checkOrder(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, { subtotal: 500, discount: 0, tax: 90, total: 590 });
});

test('CHECKOUT PARITY: invoice figures and line GST match checkout for sampled orders', function () {
  const orders = [
    {
      coupon: '',
      items: [
        item(2, 'GRN-002', 'Unpolished Toor Dal 1kg', '0713', 165, 2),
        item(6, 'DRY-001', 'A2 Gir Cow Ghee 500ml', '0405', 450, 1)
      ]
    },
    {
      coupon: 'SAVE10',
      items: [
        item(1, 'GRN-001', 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
        item(4, 'OIL-001', 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
      ]
    },
    {
      coupon: 'SAVE10',
      items: [
        item(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
      ]
    },
    {
      coupon: '',
      items: [
        item(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 140, 1),
        item(12, 'BEV-003', 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
      ]
    }
  ];

  for (const order of orders) {
    const actual = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual({
      subtotal: actual.subtotal,
      discount: actual.discount,
      tax: actual.tax,
      cgst: actual.cgst,
      sgst: actual.sgst,
      total: actual.total
    }, {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    });
    assert.deepEqual(actual.rows.map(row => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
      checkout.lines.map(line => ({ gstPercent: line.gstPercent, lineTax: line.tax })));
  }
});
