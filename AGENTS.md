# ShopLedger

## Stack
- Node.js CommonJS app using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Persistent app data is JSON in `data/db.json`, read and written by `lib/store.js`.

## Module map
- `routes/customers.js` - customer listing and Khata settlement endpoints.
- `routes/orders.js` - order list/detail/create and cancellation endpoints.
- `routes/products.js` - product and active coupon read endpoints.
- `routes/reports.js` - dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` - coupon normalization, lookup, validation, discount calculation, and active listing.
- `lib/dates.js` - current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` - product lookup, sellable stock, checks, reserve/release, and inventory summary.
- `lib/invoice.js` - invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` - customer balances, Khata charges/reversals, and settlement records.
- `lib/orders.js` - order add, lookup, cancel, and filtered listing.
- `lib/pricing.js` - subtotal, coupon discount, and line-level GST totals.
- `lib/reports.js` - dashboard summaries and GST reconciliation calculations.
- `lib/store.js` - synchronous JSON read/write and audit-log append.
- `lib/tax.js` - item GST rate/slab resolution and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`; default port is 3000).
- Run tests: `node --test`. No test files were present when this file was written; `npm test` is a placeholder script.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
