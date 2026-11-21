# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Synchronous JSON persistence in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` lists customers and recent settlements and records Khata payments.
- `routes/orders.js` lists, looks up, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and key-protected database export.
- `lib/coupons.js` normalizes codes, validates coupons, and computes discounts.
- `lib/dates.js` provides date keys and fiscal-year helpers.
- `lib/inventory.js` checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` manages customer balances, Khata order debits and reversals, and settlements.
- `lib/orders.js` creates, finds, filters, and cancels order records.
- `lib/pricing.js` allocates discounts and computes checkout totals and line taxes.
- `lib/reports.js` summarizes sales and compares invoice figures with stored order figures.
- `lib/store.js` reads and writes the JSON database and maintains its audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout saves the billed figures, while the invoice recalculates them with different GST and coupon logic.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
