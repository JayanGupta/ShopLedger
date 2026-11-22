# ShopLedger contributor guide

## Stack
- Node.js application using Express 4 and body-parser; browser UI is static HTML, CSS, and JavaScript in `public/`.
- Data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/products.js` — product catalog and active coupon GET endpoints.
- `routes/orders.js` — list/get/create/cancel order endpoints.
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, normalized date key, and fiscal year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balance listing, Khata charges/reversals, and settlements.
- `lib/orders.js` — order add/get/cancel/list operations.
- `lib/pricing.js` — subtotal, discount delegation, checkout totals, and line tax breakdown.
- `lib/reports.js` — dashboard summary and stored-order versus invoice GST reconciliation.
- `lib/store.js` — JSON database read/write and bounded audit log append.
- `lib/tax.js` — item GST rate/slab lookup and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node.js built-in test runner; no test files are currently documented in `package.json`).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
