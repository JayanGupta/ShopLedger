# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Static browser UI in `public/` uses HTML, CSS, and XMLHttpRequest.
- Data is persisted in `data/db.json` through synchronous file reads and writes.
- Tests use Node's built-in `node:test` and `node:assert/strict`.

## Module map
- `routes/products.js`: product catalog and active-coupon API routes.
- `routes/orders.js`: order listing, retrieval, creation, and cancellation API routes.
- `routes/customers.js`: customer Khata listing and settlement API routes.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview, and admin-export routes.
- `lib/coupons.js`: coupon normalization, validation, discount calculation, and active-coupon listing.
- `lib/dates.js`: Indian date formatting, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js`: product lookup, sellable-stock checks, stock changes, and inventory summaries.
- `lib/invoice.js`: printable invoice figure calculation and HTML rendering.
- `lib/ledger.js`: customer balance, Khata charge/reversal, and settlement logic.
- `lib/orders.js`: order add, get, cancel, and filtered-list logic.
- `lib/pricing.js`: cart subtotal, discount, GST, and total calculations.
- `lib/reports.js`: dashboard metrics and invoice-versus-ledger GST reconciliation.
- `lib/store.js`: `data/db.json` read/write and audit-log append operations.
- `lib/tax.js`: item GST-rate resolution and CGST/SGST splitting.

## Commands
- Start the app: `npm start`
- Run tests: `node --test`

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js`; use `lib/tax.js` only if truly needed.
