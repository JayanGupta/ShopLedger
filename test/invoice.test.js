'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, sku, hsn, gstRate, price, qty) {
  return { name: name, sku: sku, hsn: hsn, gstRate: gstRate, price: price, qty: qty };
}

function invoiceSnapshot(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(function (row) {
      return {
        name: row.name,
        sku: row.sku,
        hsn: row.hsn,
        qty: row.qty,
        price: row.price,
        gstPercent: row.gstPercent,
        line: row.line,
        lineTax: row.lineTax
      };
    })
  };
}

function checkoutSnapshot(totals) {
  return {
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxable: totals.taxable,
    tax: totals.tax,
    cgst: totals.cgst,
    sgst: totals.sgst,
    total: totals.total
  };
}

const scenarios = [
  {
    name: 'CURRENT BEHAVIOUR: order #1001 with 5% and 12% items and no coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        line('Toor Dal 1kg', 'GRN-002', '0713', 5, 165, 2),
        line('Ghee 500ml', 'DRY-001', '0405', 12, 280, 1)
      ]
    },
    expectedInvoice: {
      subtotal: 610,
      discount: 0,
      tax: 50.1,
      cgst: 25.05,
      sgst: 25.05,
      total: 660.1,
      rows: [
        { name: 'Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
        { name: 'Ghee 500ml', sku: 'DRY-001', hsn: '0405', qty: 1, price: 280, gstPercent: 12, line: 280, lineTax: 33.6 }
      ]
    },
    expectedCheckout: {
      subtotal: 610,
      discount: 0,
      taxable: 610,
      tax: 50.1,
      cgst: 25.05,
      sgst: 25.05,
      total: 660.1
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1002 SAVE10 applies discount before tax',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        line('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 5, 640, 1),
        line('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 5, 190, 2)
      ]
    },
    expectedInvoice: {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      rows: [
        { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    expectedCheckout: {
      subtotal: 1020,
      discount: 102,
      taxable: 918,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1004 SAVE10 is capped at ₹150 before tax',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        line('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 5, 1120, 2)
      ]
    },
    expectedInvoice: {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    expectedCheckout: {
      subtotal: 2240,
      discount: 150,
      taxable: 2090,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 with only 18% items and no coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        line('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 18, 140, 1),
        line('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 18, 180, 2)
      ]
    },
    expectedInvoice: {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      rows: [
        { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    expectedCheckout: {
      subtotal: 500,
      discount: 0,
      taxable: 500,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590
    }
  }
];

scenarios.forEach(function (scenario) {
  test(scenario.name, function () {
    const invoiceFigures = invoice.computeInvoiceFigures(scenario.order);
    const checkoutTotals = pricing.computeTotals(scenario.order.items, scenario.order.coupon);

    assert.deepStrictEqual(invoiceSnapshot(invoiceFigures), scenario.expectedInvoice);
    assert.deepStrictEqual(checkoutSnapshot(checkoutTotals), scenario.expectedCheckout);
  });
});

test('CORRECT BEHAVIOUR: invoice matches checkout for mixed HSN slabs and capped SAVE10', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      line('5% item', 'TEST-5', '0713', undefined, 1000, 1),
      line('12% item', 'TEST-12', '0405', undefined, 1240, 1)
    ]
  };

  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutTotals = pricing.computeTotals(order.items, order.coupon);

  const expected = {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 185.49,
    cgst: 92.75,
    sgst: 92.74,
    total: 2275.49
  };

  assert.deepStrictEqual(checkoutSnapshot(checkoutTotals), expected);
  assert.deepStrictEqual(invoiceSnapshot(invoiceFigures), {
    subtotal: expected.subtotal,
    discount: expected.discount,
    tax: expected.tax,
    cgst: expected.cgst,
    sgst: expected.sgst,
    total: expected.total,
    rows: [
      { name: '5% item', sku: 'TEST-5', hsn: '0713', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 46.65 },
      { name: '12% item', sku: 'TEST-12', hsn: '0405', qty: 1, price: 1240, gstPercent: 12, line: 1240, lineTax: 138.84 }
    ]
  });
});


