const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// In-memory examples only. #1001 is modelled with the requested 5%/12% mix.
// Undefined gstRate models lines without an explicit override: HSN drives checkout.
function item(id, name, hsn, price, qty) {
  return { id, name, sku: 'TEST-' + id, hsn, price, qty, gstRate: undefined };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-style invoice uses 5%/12% HSN GST',
    order: {
      id: 1001, coupon: '',
      items: [item(2, 'Dal', '0713', 165, 2), item(6, 'Ghee', '0405', 450, 1)]
    },
    invoice: { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 },
    invoiceLines: [[5, 330, 16.5], [12, 450, 54]],
    checkout: { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 },
    checkoutLines: [[5, 0, 16.5], [12, 0, 54]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 invoice discounts before HSN GST',
    order: {
      id: 1002, coupon: 'SAVE10',
      items: [item(1, 'Rice', '1006', 640, 1), item(4, 'Oil', '1512', 190, 2)]
    },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    invoiceLines: [[5, 640, 28.8], [5, 380, 17.1]],
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutLines: [[5, 64, 28.8], [5, 38, 17.1]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice respects SAVE10 cap on INR 2240',
    order: {
      id: 1004, coupon: 'SAVE10',
      items: [item(5, 'Groundnut oil', '1508', 1120, 2)]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    invoiceLines: [[5, 2240, 104.5]],
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutLines: [[5, 150, 104.5]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% no-coupon invoice matches checkout',
    order: {
      id: 1008, coupon: '',
      items: [item(8, 'Tea', '0902', 140, 1), item(12, 'Kokum', '2106', 180, 2)]
    },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceLines: [[18, 140, 25.2], [18, 360, 64.8]],
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutLines: [[18, 0, 25.2], [18, 0, 64.8]]
  }
];

test('Invoice totals and per-line GST match checkout billing', () => {
  const roundingOrder = {
    coupon: '',
    items: [item(1, 'Fractional price', '1006', 0.1, 3), item(2, 'Rice', '1006', 1, 1)]
  };
  const orders = cases.map(scenario => scenario.order).concat({
    coupon: 'SAVE10',
    items: [
      item(1, 'Rice', '1006', 640, 1),
      item(6, 'Ghee', '0405', 450, 2),
      item(8, 'Tea', '0902', 140, 5)
    ]
  }, roundingOrder, {
    coupon: '',
    items: [
      { ...item(1, 'Zero override', '0902', 100, 1), gstRate: 0 },
      { ...item(2, 'Decimal override', '0902', 100, 1), gstRate: 0.05 },
      { ...item(3, 'Percent override', '0902', 100, 1), gstRate: 12 }
    ]
  });
  for (const [coupon, price] of [['SAVE10', 499], ['SAVE10', 500], ['DIWALI20', 2240], ['FLAT50', 400]]) {
    orders.push({ coupon, items: [item(1, 'Rice', '1006', price, 1)] });
  }
  for (const order of orders) {
    const billed = pricing.computeTotals(order.items, order.coupon);
    const figures = invoice.computeInvoiceFigures(order);
    for (const field of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
      assert.strictEqual(figures[field], billed[field], field);
    }
    assert.deepStrictEqual(
      figures.rows.map(row => [row.gstPercent, row.lineTax]),
      billed.lines.map(line => [line.gstPercent, line.tax])
    );
    if (order === roundingOrder) {
      assert.deepStrictEqual(
        [figures.subtotal, figures.tax, figures.cgst, figures.sgst, figures.total],
        [1.3, 0.07, 0.04, 0.03, 1.37]
      );
      assert.deepStrictEqual(figures.rows.map(row => row.lineTax), [0.02, 0.05]);
    }
    const html = invoice.render({ ...order, total: billed.total });
    assert.ok(html.includes('Invoice Total</td><td class="r">₹' + billed.total.toFixed(2)));
    assert.ok(html.includes('CGST + SGST (Total GST)</td><td class="r">₹' + billed.tax.toFixed(2)));
    for (const line of billed.lines) {
      assert.ok(html.includes('<td class="r">' + line.gstPercent + '%</td>'));
      assert.ok(html.includes('<td class="r">₹' + line.tax.toFixed(2) + '</td>'));
    }
    if (billed.discount) assert.ok(html.includes('-₹' + billed.discount.toFixed(2)));
    assert.ok(!html.includes('Accountant Reconciliation Notice:'));
    assert.ok(invoice.render({ ...order, total: billed.total + 1 }).includes('Accountant Reconciliation Notice:'));
  }
});

for (const scenario of cases) {
  test(scenario.name, () => {
    const order = scenario.order;
    const actualInvoice = invoice.computeInvoiceFigures(order);
    const actualCheckout = pricing.computeTotals(order.items, order.coupon);

    // Literal expectations pin invoice figures independently of the pricing call.
    const { rows, ...figures } = actualInvoice;
    assert.deepStrictEqual(figures, scenario.invoice);
    assert.deepStrictEqual(rows, order.items.map((line, index) => ({
      name: line.name,
      sku: line.sku,
      hsn: line.hsn,
      qty: line.qty,
      price: line.price,
      gstPercent: scenario.invoiceLines[index][0],
      line: scenario.invoiceLines[index][1],
      lineTax: scenario.invoiceLines[index][2]
    })));

    const { taxable, lines, ...checkoutFigures } = actualCheckout;
    assert.deepStrictEqual(checkoutFigures, scenario.checkout);
    assert.strictEqual(taxable, scenario.checkout.subtotal - scenario.checkout.discount);
    assert.deepStrictEqual(
      lines.map(line => [line.gstPercent, line.discount, line.tax]),
      scenario.checkoutLines
    );
  });
}
