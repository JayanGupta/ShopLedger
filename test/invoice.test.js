const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function lineTaxes(lines, amountKey) {
  return lines.map((line) => [line.gstPercent, line[amountKey]]);
}

test('invoice matches checkout GST and totals when SAVE10 reaches its cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }],
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
  });
  assert.deepEqual(figures(printed), figures(billed));
  assert.deepEqual(lineTaxes(printed.rows, 'lineTax'), [[5, 104.5]]);

  const savedOrder = {
    ...order,
    coupon: 'DIWALI20',
    subtotal: 2240,
    discount: 200,
    tax: 102,
    total: 2142,
  };
  const reprint = invoice.computeInvoiceFigures(savedOrder);
  assert.deepEqual(figures(reprint), {
    subtotal: 2240, discount: 200, tax: 102, cgst: 51, sgst: 51, total: 2142,
  });
  assert.deepEqual(lineTaxes(reprint.rows, 'lineTax'), [[5, 102]]);
});

test('#1001 invoice uses the 5% and 12% HSN rates', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 200, qty: 1, hsn: '0405', gstRate: undefined },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 400, discount: 0, tax: 34, cgst: 17, sgst: 17, total: 434,
  });
  assert.deepEqual(lineTaxes(printed.rows, 'lineTax'), [[5, 10], [12, 24]]);
  assert.deepEqual(figures(billed), {
    subtotal: 400, discount: 0, tax: 34, cgst: 17, sgst: 17, total: 434,
  });
  assert.deepEqual(lineTaxes(billed.lines, 'tax'), [[5, 10], [12, 24]]);
});

test('#1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 200, qty: 2, hsn: '0405', gstRate: 12 },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 600, discount: 60, tax: 52.2, cgst: 26.1, sgst: 26.1, total: 592.2,
  });
  assert.deepEqual(lineTaxes(printed.rows, 'lineTax'), [[5, 9], [12, 43.2]]);
  assert.deepEqual(figures(billed), {
    subtotal: 600, discount: 60, tax: 52.2, cgst: 26.1, sgst: 26.1, total: 592.2,
  });
  assert.deepEqual(lineTaxes(billed.lines, 'tax'), [[5, 9], [12, 43.2]]);
});

test('#1004 invoice applies the SAVE10 cap on a ₹2,240 subtotal', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 560, qty: 4, hsn: '0902', gstRate: 18 }],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
  });
  assert.deepEqual(lineTaxes(printed.rows, 'lineTax'), [[18, 376.2]]);
  assert.deepEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
  });
  assert.deepEqual(lineTaxes(billed.lines, 'tax'), [[18, 376.2]]);
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice matches billing without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: 18 },
      { name: 'Coffee', price: 150, qty: 1, hsn: '0901', gstRate: undefined },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 350, discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413,
  });
  assert.deepEqual(lineTaxes(printed.rows, 'lineTax'), [[18, 36], [18, 27]]);
  assert.deepEqual(figures(billed), figures(printed));
  assert.deepEqual(lineTaxes(billed.lines, 'tax'), lineTaxes(printed.rows, 'lineTax'));
});
