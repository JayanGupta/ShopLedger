# ShopLedger

## Stack
- Node.js, CommonJS, Express, and body-parser; no Node version is declared in package.json.
- Browser UI uses HTML, CSS, and plain JavaScript in public/.
- server.js mounts API routers at /api and serves public/ and printable HTML invoices.
- config.js supplies shop, tax, coupon, inventory, and server settings.
- lib/store.js synchronously reads and rewrites data/db.json.

## Module map
- routes/products.js: Product listing with category/search filters and active coupon listing.
- routes/orders.js: Order listing, lookup, placement, and cancellation.
- routes/customers.js: Customer balances, recent settlements, and settlement recording.
- routes/reports.js: Dashboard, GST reconciliation, pricing preview, and key-protected database export.
- lib/coupons.js: Coupon normalization, lookup, validation, discount calculation, and active listing.
- lib/dates.js: Local DD/MM/YYYY dates, date-string normalization, and fiscal-year labels.
- lib/inventory.js: Product lookup, sellable stock, availability checks, stock deduction, release, and summary.
- lib/invoice.js: Separate invoice calculations and printable HTML rendering.
- lib/ledger.js: Customer lookup, balance summaries, Khata charges/reversals, and settlements.
- lib/orders.js: Order creation, lookup, cancellation, search, status/date filtering, and sorting.
- lib/pricing.js: Subtotals, coupon discounts, and discounted line GST calculations.
- lib/reports.js: Dashboard aggregates and stored-order versus invoice reconciliation.
- lib/store.js: JSON persistence, collection/counter defaults, and capped audit logging.
- lib/tax.js: GST rate lookup and CGST/SGST splitting.

## Commands
- Start the app: `node server.js` (also available as `npm start`).
- Run tests with Node's built-in runner: `node --test`.
- No test files currently exist; package.json's `npm test` is a failing placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Order history sorting and date filtering are broken; Khata settlements corrupt customer balances.
- Allowed files: lib/orders.js (list only), lib/dates.js, lib/ledger.js, routes/customers.js.
- orders.list currently sorts raw DD/MM/YYYY strings and compares normalized DD/MM/YYYY strings for ranges.
- dates.normalizeDateKey converts YYYY-MM-DD to DD/MM/YYYY, not a chronological comparison key.
- routes/customers.js passes the raw settlement amount to ledger.recordSettlement.
- ledger.recordSettlement adds that raw amount to totalSettled before converting the entry amount to Number.
