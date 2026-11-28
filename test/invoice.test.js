const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function checkOrder(order, expectedInvoice, expectedCheckout, expectedLineTaxes) {
  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(printed), expectedInvoice, 'printed invoice');
  assert.deepEqual(amounts(billed), expectedCheckout, 'checkout bill');
  assert.deepEqual(
    printed.rows.map(({ hsn, gstPercent, lineTax }) => [hsn, gstPercent, lineTax]),
    expectedLineTaxes,
    'invoice GST by line'
  );
}

test('#1001 prints the 5% and 12% HSN slabs used by checkout', () => {
  // Checkout snapshots can carry the HSN without an explicit gstRate.
  const order = { id: 1001, coupon: '', items: [
    { name: 'Rice', hsn: '1006', price: 100, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 100, qty: 1 },
  ] };
  const billed = { subtotal: 300, discount: 0, tax: 22, cgst: 11, sgst: 11, total: 322 };
  checkOrder(order, billed, billed, [['1006', 5, 10], ['0405', 12, 12]]);
});

test('#1002 SAVE10 reduces taxable value before the GST split', () => {
  // Supply the rate to isolate coupon behaviour from the invoice rate fallback.
  const order = { id: 1002, coupon: 'SAVE10', items: [
    { name: 'Ghee', hsn: '0405', gstRate: 12, price: 300, qty: 2 },
  ] };
  const billed = { subtotal: 600, discount: 60, tax: 64.8, cgst: 32.4, sgst: 32.4, total: 604.8 };
  checkOrder(order, billed, billed, [['0405', 12, 64.8]]);
});

test('#1004 invoice honours the SAVE10 cap', () => {
  const order = { id: 1004, coupon: 'SAVE10', items: [
    { name: 'Groundnut oil', hsn: '1508', gstRate: 5, price: 1120, qty: 2 },
  ] };
  const billed = { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 };
  checkOrder(order, billed, billed, [['1508', 5, 104.5]]);
});

test('CURRENT BEHAVIOUR: #1008 all-18% lines match without a coupon', () => {
  const order = { id: 1008, coupon: '', items: [
    { name: 'Tea', hsn: '0902', price: 75, qty: 2 },
    { name: 'Coffee', hsn: '0901', price: 150, qty: 1 },
  ] };
  const expected = { subtotal: 300, discount: 0, tax: 54, cgst: 27, sgst: 27, total: 354 };
  checkOrder(order, expected, expected, [['0902', 18, 27], ['0901', 18, 27]]);
});

test('invoice applies capped SAVE10 before tax across mixed HSN slabs', () => {
  const order = { coupon: 'SAVE10', items: [
    { name: 'Rice', hsn: '1006', price: 560, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 1120, qty: 1 },
  ] };
  // Each line receives half the capped discount, leaving 1045 taxable per line.
  const billed = { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 };
  checkOrder(order, billed, billed, [['1006', 5, 52.25], ['0405', 12, 125.4]]);
});
