'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, hsn, gstRate = null, qty = 1) {
  return { name, price, qty, hsn, gstRate };
}

test('CORRECT BEHAVIOUR: invoice matches checkout for mixed HSN rates and capped SAVE10', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item('Rice', 1020, '1006'),
      item('Ghee', 1220, '0405')
    ]
  };
  const actualInvoice = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: actualInvoice.subtotal,
    discount: actualInvoice.discount,
    tax: actualInvoice.tax,
    cgst: actualInvoice.cgst,
    sgst: actualInvoice.sgst,
    total: actualInvoice.total,
    lines: actualInvoice.rows.map(row => ({
      gstPercent: row.gstPercent,
      gross: row.line,
      tax: row.lineTax
    }))
  }, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    lines: checkout.lines.map(line => ({
      gstPercent: line.gstPercent,
      gross: line.gross,
      tax: line.tax
    }))
  });
});
