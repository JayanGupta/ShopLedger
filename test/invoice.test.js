const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Saved order lines contain price, qty, and HSN, but no gstRate. Keeping that
// shape is important: invoice.js falls back to the default rate while pricing
// resolves the HSN slab. gstRate is present as undefined to document that
// absence and to exercise both modules with the same line objects.
function line(name, hsn, price, qty) {
  return { name, sku: name, hsn, price, qty, gstRate: undefined };
}

function check(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
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

test('invoice matches checkout HSN GST on #1001 mixed 5% and 18% lines', () => {
  const order = {
    coupon: '',
    items: [
      line('Assam CTC Masala Chai', '0902', 140, 2),
      line('Unpolished Toor Dal', '0713', 165, 2)
    ]
  };

  check(order, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai', sku: 'Assam CTC Masala Chai', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal', sku: 'Unpolished Toor Dal', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  }, { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 });
});

test('invoice matches checkout HSN GST and pre-tax SAVE10 discount on #1002', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      line('Indrayani Basmati Rice', '1006', 640, 1),
      line('Cold-Pressed Sunflower Oil', '1512', 190, 2)
    ]
  };

  check(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice', sku: 'Indrayani Basmati Rice', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil', sku: 'Cold-Pressed Sunflower Oil', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
});

test('invoice applies #1004 SAVE10 cap before HSN GST', () => {
  const order = {
    coupon: 'SAVE10',
    items: [line('Cold-Pressed Groundnut Oil', '1508', 1120, 2)]
  };

  check(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil', sku: 'Cold-Pressed Groundnut Oil', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice matches checkout when there is no coupon', () => {
  const order = {
    coupon: '',
    items: [
      line('Assam CTC Masala Chai', '0902', 140, 1),
      line('Kokum Sherbet Concentrate', '2106', 180, 2)
    ]
  };

  check(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai', sku: 'Assam CTC Masala Chai', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate', sku: 'Kokum Sherbet Concentrate', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, { subtotal: 500, discount: 0, tax: 90, total: 590 });
});

test('invoice matches checkout HSN GST and capped pre-tax SAVE10 discount', () => {
  const order = {
    coupon: 'SAVE10',
    items: [line('Cold-Pressed Groundnut Oil', '1508', 1120, 2)]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil', sku: 'Cold-Pressed Groundnut Oil', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(figures.subtotal, checkout.subtotal);
  assert.equal(figures.discount, checkout.discount);
  assert.equal(figures.tax, checkout.tax);
  assert.equal(figures.total, checkout.total);
  assert.equal(figures.rows[0].gstPercent, checkout.lines[0].gstPercent);
  assert.equal(figures.rows[0].lineTax, checkout.lines[0].tax);
});
