var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function getFigures(order) {
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  return {
    invoice: {
      subtotal: printed.subtotal,
      discount: printed.discount,
      tax: printed.tax,
      cgst: printed.cgst,
      sgst: printed.sgst,
      total: printed.total,
      lines: printed.rows.map(function (row) {
        return { rate: row.gstPercent, tax: row.lineTax };
      })
    },
    checkout: {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total,
      lines: billed.lines.map(function (line) {
        return { rate: line.gstPercent, tax: line.tax };
      })
    }
  };
}

test('invoice matches checkout for a capped coupon on a 5% HSN line', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ id: 1, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };
  var figures = getFigures(order);

  assert.deepEqual(figures.checkout, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    lines: [{ rate: 5, tax: 104.5 }]
  });
  assert.deepEqual(figures.invoice, figures.checkout);
});

test('#1001 invoice uses the checkout rates for mixed HSN slabs', function () {
  // Saved checkout lines carry HSN without a gstRate value.
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { id: 2, name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  };

  assert.deepEqual(getFigures(order), {
    invoice: {
      subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
      lines: [{ rate: 5, tax: 10 }, { rate: 12, tax: 36 }]
    },
    checkout: {
      subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
      lines: [{ rate: 5, tax: 10 }, { rate: 12, tax: 36 }]
    }
  });
});

test('#1002 invoice applies SAVE10 before GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 3, name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: undefined }
    ]
  };

  assert.deepEqual(getFigures(order), {
    invoice: {
      subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2,
      lines: [{ rate: 18, tax: 97.2 }]
    },
    checkout: {
      subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2,
      lines: [{ rate: 18, tax: 97.2 }]
    }
  });
});

test('#1004 invoice applies the SAVE10 cap', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 3, name: 'Tea', price: 560, qty: 4, hsn: '0902', gstRate: undefined }
    ]
  };

  assert.deepEqual(getFigures(order), {
    invoice: {
      subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
      lines: [{ rate: 18, tax: 376.2 }]
    },
    checkout: {
      subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
      lines: [{ rate: 18, tax: 376.2 }]
    }
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% order matches without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: 18 },
      { id: 4, name: 'Coffee', price: 300, qty: 1, hsn: '0901', gstRate: undefined }
    ]
  };
  var expected = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lines: [{ rate: 18, tax: 36 }, { rate: 18, tax: 54 }]
  };

  assert.deepEqual(getFigures(order), { invoice: expected, checkout: expected });
});
