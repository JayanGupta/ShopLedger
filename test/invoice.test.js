'use strict';

const test = require('node:test');
const assert = require('node:assert');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic, in-memory orders only. Do not load the persisted database.
// #1001 uses the ticket's requested 5%/12% mix, not a historical-data copy.
// An undefined gstRate exercises HSN resolution without an explicit override.
function item(id, name, hsn, price, qty) {
  return { id, name, sku: 'TEST-' + id, hsn, price, qty, gstRate: undefined };
}

function figures(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

function characterize(order, expectedInvoice, expectedCheckout, expectedRates) {
  // Both calculations receive the identical items and coupon; no store module.
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);
  assert.deepStrictEqual(printed, expectedInvoice);
  assert.deepStrictEqual(figures(checkout), expectedCheckout);
  assert.deepStrictEqual(checkout.lines.map(line => line.gstPercent), expectedRates);
  return { printed, checkout };
}

test('Invoice matches checkout HSN slabs and capped discount before tax', () => {
  const order = {
    id: 2001,
    coupon: 'SAVE10',
    items: [
      item(1, 'Rice', '1006', 1000, 1),
      item(6, 'Ghee', '0405', 1000, 1),
      item(8, 'Tea', '0902', 1000, 1)
    ],
    subtotal: 3000, discount: 150, tax: 332.5, total: 3182.5
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const expected = {
    subtotal: 3000, discount: 150, tax: 332.5,
    cgst: 166.25, sgst: 166.25, total: 3182.5
  };
  assert.deepStrictEqual(figures(checkout), expected);
  const printed = invoice.computeInvoiceFigures(order);
  assert.deepStrictEqual(figures(printed), expected);
  assert.deepStrictEqual(printed.rows.map(row => row.gstPercent), [5, 12, 18]);
  assert.deepStrictEqual(printed.rows.map(row => row.lineTax), [47.5, 114, 171]);
  assert.deepStrictEqual(printed.rows.map(row => row.lineTax), checkout.lines.map(line => line.tax));
  const html = invoice.render(order);
  assert.ok(html.includes('₹3182.50'));
  assert.ok(html.includes('₹332.50'));
  assert.ok(html.includes('-₹150.00'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));
});

test('CURRENT BEHAVIOUR: #1001-like 5%/12% HSNs match checkout', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [item(1, 'Rice', '1006', 640, 1), item(6, 'Ghee', '0405', 450, 1)]
  };
  const { printed, checkout } = characterize(order, {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
    rows: [
      { name: 'Rice', sku: 'TEST-1', hsn: '1006', qty: 1, price: 640,
        gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'TEST-6', hsn: '0405', qty: 1, price: 450,
        gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176
  }, [5, 12]);
  assert.deepStrictEqual(figures(printed), figures(checkout));
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 discounts subtotal before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [item(1, 'Rice', '1006', 640, 1), item(4, 'Oil', '1512', 190, 2)]
  };
  const { printed, checkout } = characterize(order, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
    rows: [
      { name: 'Rice', sku: 'TEST-1', hsn: '1006', qty: 1, price: 640,
        gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Oil', sku: 'TEST-4', hsn: '1512', qty: 2, price: 190,
        gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  }, [5, 5]);
  assert.deepStrictEqual(figures(printed), figures(checkout));
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice respects the 150 rupee cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item(5, 'Bulk oil', '1508', 1120, 2)]
  };
  const { printed, checkout } = characterize(order, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [
      { name: 'Bulk oil', sku: 'TEST-5', hsn: '1508', qty: 2, price: 1120,
        gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  }, [5]);
  assert.deepStrictEqual(figures(printed), figures(checkout));
});

test('CURRENT BEHAVIOUR: #1008 all-18% no-coupon invoice matches checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [item(8, 'Tea', '0902', 140, 1), item(12, 'Concentrate', '2106', 180, 2)]
  };
  const { printed, checkout } = characterize(order, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    rows: [
      { name: 'Tea', sku: 'TEST-8', hsn: '0902', qty: 1, price: 140,
        gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Concentrate', sku: 'TEST-12', hsn: '2106', qty: 2, price: 180,
        gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  }, [18, 18]);
  assert.deepStrictEqual(figures(printed), figures(checkout));
});
