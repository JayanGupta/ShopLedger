const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const orderCases = [
  {
    name: 'CURRENT BEHAVIOUR: order #1001 mixed 5% and 12% GST without coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Indrayani Basmati Rice 5kg', price: 140, qty: 2, hsn: '1006', gstRate: 5 },
        { name: 'A2 Gir Cow Ghee 500ml', price: 165, qty: 2, hsn: '0405', gstRate: 12 }
      ]
    },
    invoiceExpected: {
      subtotal: 610,
      discount: 0,
      tax: 53.6,
      cgst: 26.8,
      sgst: 26.8,
      total: 663.6,
      rows: [
        { name: 'Indrayani Basmati Rice 5kg', sku: '-', hsn: '1006', qty: 2, price: 140, gstPercent: 5, line: 280, lineTax: 14 },
        { name: 'A2 Gir Cow Ghee 500ml', sku: '-', hsn: '0405', qty: 2, price: 165, gstPercent: 12, line: 330, lineTax: 39.6 }
      ]
    },
    pricingExpected: { subtotal: 610, discount: 0, tax: 53.6, total: 663.6 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1002 SAVE10 matches checkout discount and post-discount GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Indrayani Basmati Rice 5kg', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
        { name: 'Cold-Pressed Sunflower Oil 1L', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
      ]
    },
    invoiceExpected: {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      rows: [
        { name: 'Indrayani Basmati Rice 5kg', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Cold-Pressed Sunflower Oil 1L', sku: '-', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    pricingExpected: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1004 SAVE10 applies the ₹150 cap before 5% GST',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Cold-Pressed Groundnut Oil 5L', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
      ]
    },
    invoiceExpected: {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    pricingExpected: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 all 18% GST without coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Assam CTC Masala Chai 250g', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
        { name: 'Kokum Sherbet Concentrate 750ml', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
      ]
    },
    invoiceExpected: {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      rows: [
        { name: 'Assam CTC Masala Chai 250g', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum Sherbet Concentrate 750ml', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    pricingExpected: { subtotal: 500, discount: 0, tax: 90, total: 590 }
  }
];

for (const scenario of orderCases) {
  test(scenario.name, () => {
    const invoiceFigures = invoice.computeInvoiceFigures(scenario.order);
    const checkoutFigures = pricing.computeTotals(scenario.order.items, scenario.order.coupon);

    assert.deepEqual(invoiceFigures, scenario.invoiceExpected);
    assert.equal(checkoutFigures.subtotal, scenario.pricingExpected.subtotal);
    assert.equal(checkoutFigures.discount, scenario.pricingExpected.discount);
    assert.equal(checkoutFigures.tax, scenario.pricingExpected.tax);
    assert.equal(checkoutFigures.total, scenario.pricingExpected.total);
  });
}

test('INVOICE MATCH: #1004 uses capped SAVE10 discount before 5% GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Cold-Pressed Groundnut Oil 5L', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});
