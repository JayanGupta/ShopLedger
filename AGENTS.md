# ShopLedger agent guide

## Stack
- Node.js with Express 4 and body-parser 1; `server.js` serves `public/` and mounts the API routers.
- CommonJS modules; `lib/store.js` reads and writes `data/db.json` as JSON.
- The browser UI is `public/index.html`, `public/js/app.js`, and `public/css/style.css`.

## Module map
- `routes/products.js` — product and active-coupon endpoints.
- `routes/orders.js` — order listing, lookup, placement, and cancellation.
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal year helpers.
- `lib/inventory.js` — product lookup, sellable-stock checks, deductions, release, and summary.
- `lib/invoice.js` — printable invoice HTML and its invoice-figure calculation.
- `lib/ledger.js` — Khata balances, order charges and reversals, and settlements.
- `lib/orders.js` — add, get, cancel, and list orders.
- `lib/pricing.js` — cart subtotal, discount, line GST, and checkout totals.
- `lib/reports.js` — dashboard summary and GST reconciliation.
- `lib/store.js` — JSON database read/write and audit entries.
- `lib/tax.js` — item GST rate lookup and CGST/SGST split.

## Commands
- Start the app: `node server.js` (also available as `npm start`).
- Run Node tests: `node --test`. The current `npm test` script is a failing placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
