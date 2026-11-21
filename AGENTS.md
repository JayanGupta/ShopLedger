# ShopLedger guidance

## Stack
- Node.js CommonJS app using Express 4 and body-parser; package metadata declares `express` and `body-parser` dependencies.
- Browser UI is static HTML, CSS, and JavaScript under `public/`.
- Application data is read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — customer and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, placement, and cancellation endpoints.
- `routes/products.js` — product and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, stock updates, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlement recording.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount delegation, and checkout totals by line.
- `lib/reports.js` — dashboard summary and invoice-to-order GST reconciliation.
- `lib/store.js` — JSON database read/write, structure defaults, and audit log updates.
- `lib/tax.js` — item GST rate resolution and CGST/SGST splitting.

## Commands
- Start the app: `node server.js` (equivalent to the package `start` script, `node server.js`).
- Run tests: `node --test` (Node's built-in test runner; no test files are currently present in the repository).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
