'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, sku, hsn, price, qty, gstRate) {
  return { id, name, sku, hsn, price, qty, gstRate };
}

function calculate(id, items, coupon) {
  const order = { id, items, coupon };
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 no-coupon invoice matches checkout for mixed 5% and 12% items', () => {
  const items = [
    item(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    item(6, 'Pure Cow Ghee 1L', 'DAI-001', '0405', 620, 1, 12)
  ];
  const result = calculate(1001, items, '');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1260,
    discount: 0,
    tax: 106.4,
    cgst: 53.2,
    sgst: 53.2,
    total: 1366.4,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Pure Cow Ghee 1L', sku: 'DAI-001', hsn: '0405', qty: 1, price: 620, gstPercent: 12, line: 620, lineTax: 74.4 }
    ]
  });
  assert.deepStrictEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, cgst: result.checkout.cgst, sgst: result.checkout.sgst, total: result.checkout.total },
    { discount: 0, tax: 106.4, cgst: 53.2, sgst: 53.2, total: 1366.4 }
  );
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice applies discount before tax and matches checkout', () => {
  const items = [
    item(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    item(4, 'Sunflower Oil 1L', 'OIL-001', '1512', 210, 2, 5)
  ];
  const result = calculate(1002, items, 'SAVE10');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1060,
    discount: 106,
    tax: 47.7,
    cgst: 23.85,
    sgst: 23.85,
    total: 1001.7,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 210, gstPercent: 5, line: 420, lineTax: 18.9 }
    ]
  });
  assert.deepStrictEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, cgst: result.checkout.cgst, sgst: result.checkout.sgst, total: result.checkout.total },
    { discount: 106, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 1001.7 }
  );
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice honors the ₹150 cap and matches checkout', () => {
  const items = [
    item(5, 'Groundnut Oil 1L', 'OIL-002', '1508', 280, 8, 5)
  ];
  const result = calculate(1004, items, 'SAVE10');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil 1L', sku: 'OIL-002', hsn: '1508', qty: 8, price: 280, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepStrictEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, cgst: result.checkout.cgst, sgst: result.checkout.sgst, total: result.checkout.total },
    { discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 no-coupon invoice matches checkout for all 18% items', () => {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
    item(12, 'Syrup Concentrate', 'BEV-005', '2106', 360, 1, 18)
  ];
  const result = calculate(1008, items, '');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Syrup Concentrate', sku: 'BEV-005', hsn: '2106', qty: 1, price: 360, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.deepStrictEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, cgst: result.checkout.cgst, sgst: result.checkout.sgst, total: result.checkout.total },
    { discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
});

test('invoice matches checkout HSN tax, capped coupon discount, and final total', () => {
  const items = [
    { id: 5, name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
  ];
  const result = calculate(1004, items, 'SAVE10');

  assert.deepStrictEqual(result.invoice, {
    subtotal: result.checkout.subtotal,
    discount: result.checkout.discount,
    tax: result.checkout.tax,
    cgst: result.checkout.cgst,
    sgst: result.checkout.sgst,
    total: result.checkout.total,
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

  const historical = invoice.computeInvoiceFigures({
    id: 9999,
    coupon: 'DIWALI20',
    subtotal: 1000,
    discount: 200,
    tax: 40,
    total: 840,
    items: [
      { id: 1, name: 'Historical rice order', sku: 'GRN-001', hsn: '1006', price: 1000, qty: 1 }
    ]
  });
  assert.deepStrictEqual(historical, {
    subtotal: 1000,
    discount: 200,
    tax: 40,
    cgst: 20,
    sgst: 20,
    total: 840,
    rows: [
      {
        name: 'Historical rice order',
        sku: 'GRN-001',
        hsn: '1006',
        qty: 1,
        price: 1000,
        gstPercent: 5,
        line: 1000,
        lineTax: 40
      }
    ]
  });
});
