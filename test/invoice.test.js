const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic fixtures only: never load the application store or data/db.json.
// undefined gstRate deliberately exercises the HSN-only order-line shape.
function item(id, name, hsn, price, qty) {
  return { id, name, sku: 'TEST-' + id, hsn, price, qty, gstRate: undefined };
}

const cases = [
  {
    name: 'invoice uses mixed HSN slabs for the #1001-style order',
    // Uses the requested 5% and 12% mix; not a copy of the persisted order.
    order: { id: 1001, coupon: '', items: [
      item(2, 'Dal', '0713', 165, 2),
      item(7, 'Butter', '0405', 260, 1)
    ] },
    invoice: [590, 0, 47.7, 23.85, 23.85, 637.7],
    rows: [[5, 330, 16.5], [12, 260, 31.2]],
    checkout: [590, 0, 47.7, 23.85, 23.85, 637.7],
    checkoutRates: [5, 12],
    checkoutTaxes: [16.5, 31.2]
  },
  {
    name: 'invoice applies #1002 SAVE10 before GST',
    order: { id: 1002, coupon: 'SAVE10', items: [
      item(1, 'Rice', '1006', 640, 1),
      item(4, 'Sunflower oil', '1512', 190, 2)
    ] },
    invoice: [1020, 102, 45.9, 22.95, 22.95, 963.9],
    rows: [[5, 640, 28.8], [5, 380, 17.1]],
    checkout: [1020, 102, 45.9, 22.95, 22.95, 963.9],
    checkoutRates: [5, 5],
    checkoutTaxes: [28.8, 17.1]
  },
  {
    name: 'invoice respects the #1004 SAVE10 150 cap',
    order: { id: 1004, coupon: 'SAVE10', items: [
      item(5, 'Groundnut oil', '1508', 1120, 2)
    ] },
    invoice: [2240, 150, 104.5, 52.25, 52.25, 2194.5],
    rows: [[5, 2240, 104.5]],
    checkout: [2240, 150, 104.5, 52.25, 52.25, 2194.5],
    checkoutRates: [5],
    checkoutTaxes: [104.5]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% no-coupon totals agree',
    order: { id: 1008, coupon: '', items: [
      item(8, 'Tea', '0902', 140, 1),
      item(12, 'Concentrate', '2106', 180, 2)
    ] },
    invoice: [500, 0, 90, 45, 45, 590],
    rows: [[18, 140, 25.2], [18, 360, 64.8]],
    checkout: [500, 0, 90, 45, 45, 590],
    checkoutRates: [18, 18],
    checkoutTaxes: [25.2, 64.8]
  }
];

function figures(values) {
  const [subtotal, discount, tax, cgst, sgst, total] = values;
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('invoice matches checkout totals and per-line GST for all billing fixtures', () => {
  for (const { order } of cases) {
    const billed = pricing.computeTotals(order.items, order.coupon);
    const actual = invoice.computeInvoiceFigures(order);
    for (const key of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
      assert.strictEqual(actual[key], billed[key], 'Order ' + order.id + ': ' + key);
    }
    assert.deepStrictEqual(
      actual.rows.map(row => [row.gstPercent, row.lineTax]),
      billed.lines.map(line => [line.gstPercent, line.tax])
    );
    assert.doesNotMatch(invoice.render({ ...order, total: billed.total }), /Accountant Reconciliation Notice/);
  }
});

for (const fixture of cases) {
  test(fixture.name, () => {
    const { order } = fixture;
    const actualInvoice = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepStrictEqual(actualInvoice, {
      ...figures(fixture.invoice),
      rows: order.items.map((line, index) => {
        const [gstPercent, gross, lineTax] = fixture.rows[index];
        return {
          name: line.name, sku: line.sku, hsn: line.hsn,
          qty: line.qty, price: line.price,
          gstPercent, line: gross, lineTax
        };
      })
    });

    const { subtotal, discount, tax, cgst, sgst, total } = checkout;
    assert.deepStrictEqual(
      { subtotal, discount, tax, cgst, sgst, total },
      figures(fixture.checkout)
    );
    assert.deepStrictEqual(checkout.lines.map(line => line.gstPercent), fixture.checkoutRates);
    assert.deepStrictEqual(checkout.lines.map(line => line.tax), fixture.checkoutTaxes);
  });
}
