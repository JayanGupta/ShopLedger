const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Model the order scenarios with in-memory items. An omitted gstRate
// lets checkout and invoice pricing fall back to the HSN slab.
function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function lineGst(lines) {
  return lines.map(({ gstPercent, lineTax, tax }) => [gstPercent, lineTax ?? tax]);
}

test('CURRENT BEHAVIOUR: #1001 uses the 5% and 12% HSN slabs on the invoice', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 250, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 500, qty: 1 },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(printed), {
    subtotal: 1000, discount: 0, tax: 85, cgst: 42.5, sgst: 42.5, total: 1085,
  });
  assert.deepEqual(lineGst(printed.rows), [[5, 25], [12, 60]]);
  assert.deepEqual(lineGst(checkout.lines), [[5, 25], [12, 60]]);
  assert.equal(checkout.total, 1085);
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before calculating invoice GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 300, qty: 2 },
      { id: 3, name: 'Tea', hsn: '0902', gstRate: 18, price: 400, qty: 1 },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(printed), {
    subtotal: 1000, discount: 100, tax: 91.8, cgst: 45.9, sgst: 45.9, total: 991.8,
  });
  assert.deepEqual(lineGst(printed.rows), [[5, 27], [18, 64.8]]);
  assert.equal(checkout.discount, 100);
  assert.deepEqual(lineGst(checkout.lines), [[5, 27], [18, 64.8]]);
  assert.equal(checkout.total, 991.8);
});

test('CURRENT BEHAVIOUR: #1004 honors the SAVE10 cap on the invoice', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 3, name: 'Tea', hsn: '0902', gstRate: 18, price: 560, qty: 4 },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(amounts(printed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
  });
  assert.deepEqual(lineGst(printed.rows), [[18, 376.2]]);
  assert.equal(checkout.discount, 150);
  assert.deepEqual(lineGst(checkout.lines), [[18, 376.2]]);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', hsn: '0902', price: 125, qty: 2 },
      { id: 4, name: 'Coffee', hsn: '0901', gstRate: 18, price: 150, qty: 1 },
    ],
  };

  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  const expected = {
    subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472,
  };
  assert.deepEqual(amounts(printed), expected);
  assert.deepEqual(amounts(checkout), expected);
  assert.deepEqual(lineGst(printed.rows), [[18, 45], [18, 27]]);
  assert.deepEqual(lineGst(checkout.lines), [[18, 45], [18, 27]]);
});


test('matches checkout and prints the GST breakdown after a capped SAVE10 discount', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 500, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 620, qty: 2 },
    ],
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const billedOrder = { ...order, ...amounts(checkout) };
  const printed = invoice.computeInvoiceFigures(billedOrder);

  assert.deepEqual(amounts(printed), amounts(checkout));
  assert.deepEqual(amounts(printed), {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49,
  });
  assert.deepEqual(lineGst(printed.rows), [[5, 46.65], [12, 138.84]]);

  const html = invoice.render(billedOrder);
  assert.match(html, /<td class="r">5%<\/td><td class="r">.46\.65<\/td>/u);
  assert.match(html, /<td class="r">12%<\/td><td class="r">.138\.84<\/td>/u);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  // Simulate reprinting after the configured coupon amount has changed.
  const historical = { ...billedOrder, discount: 50, tax: 194.37, total: 2384.37 };
  const reprint = invoice.render(historical);
  assert.match(reprint, /Gross Subtotal<\/td><td class="r">.2240\.00<\/td>/u);
  assert.match(reprint, /Total GST\)<\/td><td class="r">.194\.37<\/td>/u);
  assert.match(reprint, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-.50\.00<\/td>/u);
  assert.match(reprint, /Invoice Total<\/td><td class="r">.2384\.37<\/td>/u);
  assert.match(reprint, /Accountant Reconciliation Notice/);
});
