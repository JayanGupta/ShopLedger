const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/\s+/g, '-'), price, qty: 1, hsn, gstRate };
}

function compare(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [line('Rice', 400, '1006', 5), line('Ghee', 210, '0405', 12)]
  };
  const result = compare(order);

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total },
    { subtotal: 610, discount: 0, tax: 45.2, cgst: 22.6, sgst: 22.6, total: 655.2 }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, cgst: result.checkout.cgst, sgst: result.checkout.sgst, total: result.checkout.total },
    { subtotal: 610, discount: 0, tax: 45.2, cgst: 22.6, sgst: 22.6, total: 655.2 }
  );
  assert.deepEqual(result.invoice.rows.map(function (row) { return row.gstPercent; }), [5, 12]);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 discount is applied to subtotal before GST', function () {
  const order = { id: 1002, coupon: 'SAVE10', items: [line('Rice', 1020, '1006', 5)] };
  const result = compare(order);

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 cap is applied before HSN GST', function () {
  const order = { id: 1004, coupon: 'SAVE10', items: [line('Rice', 2240, '1006', 5)] };
  const result = compare(order);

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 all-18% items without a coupon match checkout', function () {
  const order = { id: 1008, coupon: '', items: [line('Tea', 500, '0902', 18)] };
  const result = compare(order);

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, cgst: result.checkout.cgst, sgst: result.checkout.sgst, total: result.checkout.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
});

test('INVOICE MATCHES CHECKOUT: #1004 HSN GST and SAVE10 cap are applied before tax', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508' }]
  };
  const result = compare(order);

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.deepEqual(result.invoice, {
    subtotal: result.checkout.subtotal,
    discount: result.checkout.discount,
    tax: result.checkout.tax,
    cgst: result.checkout.cgst,
    sgst: result.checkout.sgst,
    total: result.checkout.total,
    rows: result.checkout.lines.map(function (entry) {
      return {
        name: entry.name,
        sku: 'OIL-002',
        hsn: entry.hsn,
        qty: 2,
        price: 1120,
        gstPercent: entry.gstPercent,
        line: entry.gross,
        lineTax: entry.tax
      };
    })
  });
});
