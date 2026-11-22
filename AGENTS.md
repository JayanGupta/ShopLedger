# ShopLedger repository notes

## Stack
- Node.js with Express 4 and body-parser; the browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Application records are read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — customer and settlement API routes.
- `routes/orders.js` — order listing, placement, lookup, and cancellation routes.
- `routes/products.js` — product and active coupon listing routes.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export routes.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date key normalization, and fiscal year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks and updates, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata order charges/reversals, and settlements.
- `lib/orders.js` — add, find, cancel, and filter orders.
- `lib/pricing.js` — cart subtotal, discount delegation, and checkout totals.
- `lib/reports.js` — dashboard summaries and invoice-to-ledger GST reconciliation.
- `lib/store.js` — JSON database read/write, structure defaults, and audit log updates.
- `lib/tax.js` — GST rate resolution and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (the repository currently has no test files or configured test suite).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
