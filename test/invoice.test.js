'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn) {
  // This matches routes/orders.js order snapshots: HSN is saved, gstRate is not.
  return { name, sku: name, price, qty, hsn };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 mixed 5% and 12% HSN items invoice now uses saved HSN slabs', coupon: '',
    items: [line('Tea', 140, 2, '0902'), line('Dal', 165, 2, '0713')],
    invoice: [610, 0, 66.9, 33.45, 33.45, 676.9, [18, 5]], pricing: [610, 0, 66.9, 676.9]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 invoice now applies capped coupon before tax', coupon: 'SAVE10',
    items: [line('Rice', 640, 1, '1006'), line('Oil', 190, 2, '1512')],
    invoice: [1020, 102, 45.9, 22.95, 22.95, 963.9, [5, 5]], pricing: [1020, 102, 45.9, 963.9]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 SAVE10 invoice now applies cap before HSN tax', coupon: 'SAVE10',
    items: [line('Groundnut oil', 1120, 2, '1508')],
    invoice: [2240, 150, 104.5, 52.25, 52.25, 2194.5, [5]], pricing: [2240, 150, 104.5, 2194.5]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18% HSN items without coupon invoice matches checkout', coupon: '',
    items: [line('Tea', 140, 1, '0902'), line('Sherbet', 180, 2, '2106')],
    invoice: [500, 0, 90, 45, 45, 590, [18, 18]], pricing: [500, 0, 90, 590]
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const actualInvoice = invoice.computeInvoiceFigures({ items: scenario.items, coupon: scenario.coupon });
    const actualPricing = pricing.computeTotals(scenario.items, scenario.coupon);
    assert.deepEqual([
      actualInvoice.subtotal, actualInvoice.discount, actualInvoice.tax, actualInvoice.cgst,
      actualInvoice.sgst, actualInvoice.total, actualInvoice.rows.map(row => row.gstPercent)
    ], scenario.invoice);
    assert.deepEqual([
      actualPricing.subtotal, actualPricing.discount, actualPricing.tax, actualPricing.total
    ], scenario.pricing);
  });
}

test('invoice matches checkout HSN slabs, capped coupon, subtotal, GST, and total', () => {
  const items = [line('Groundnut oil', 1120, 2, '1508')];
  const expected = pricing.computeTotals(items, 'SAVE10');
  const actual = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });

  assert.equal(actual.subtotal, expected.subtotal);
  assert.equal(actual.discount, expected.discount);
  assert.equal(actual.tax, expected.tax);
  assert.equal(actual.total, expected.total);
  assert.deepEqual(actual.rows.map(row => row.gstPercent), [5]);
});

