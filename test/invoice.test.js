const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/[^A-Z0-9]+/g, '-'), price, qty, hsn, gstRate };
}

function order(id, items, coupon) {
  return { id, items, coupon, total: 0 };
}

function assertCurrentInvoice(orderToCheck, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(orderToCheck);
  const pricingFigures = pricing.computeTotals(orderToCheck.items, orderToCheck.coupon);

  assert.deepStrictEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total
    },
    expectedInvoice
  );
  assert.deepStrictEqual(
    {
      subtotal: pricingFigures.subtotal,
      discount: pricingFigures.discount,
      tax: pricingFigures.tax,
      cgst: pricingFigures.cgst,
      sgst: pricingFigures.sgst,
      total: pricingFigures.total
    },
    expectedPricing
  );
}

test('CORRECT BEHAVIOUR: invoice matches checkout for #1004 HSN GST and capped SAVE10', () => {
  const items = [
    line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
  ];
  const checkout = pricing.computeTotals(items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures(order(1004, items, 'SAVE10'));

  assert.deepStrictEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercent: invoiceFigures.rows[0].gstPercent,
      lineTax: invoiceFigures.rows[0].lineTax
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total,
      gstPercent: checkout.lines[0].gstPercent,
      lineTax: checkout.lines[0].tax
    }
  );
});

test('CURRENT BEHAVIOUR: invoice and pricing agree for #1001 mixed 5% and 12% GST with no coupon', () => {
  const items = [
    line('Unpolished Toor Dal 1kg', 165, 2, '0713', 5),
    line('A2 Gir Cow Ghee 500ml', 450, 1, '0405', 12)
  ];

  assertCurrentInvoice(
    order(1001, items, ''),
    { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 },
    { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 }
  );
});

test('CURRENT BEHAVIOUR: invoice matches capped checkout discount and GST for #1002', () => {
  const items = [
    line('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
    line('Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
  ];

  assertCurrentInvoice(
    order(1002, items, 'SAVE10'),
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: invoice applies SAVE10 maxDiscount for #1004', () => {
  const items = [
    line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
  ];

  assertCurrentInvoice(
    order(1004, items, 'SAVE10'),
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: invoice and pricing agree for #1008 all-18% GST with no coupon', () => {
  const items = [
    line('Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
    line('Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
  ];

  assertCurrentInvoice(
    order(1008, items, ''),
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
});
