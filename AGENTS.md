# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4 and body-parser 1.
- Static HTML, CSS and plain JavaScript in `public/`; XMLHttpRequest calls JSON APIs.
- `server.js` serves `public/`, mounts routers at `/api` and exposes printable HTML invoices.
- `config.js` holds port, shop details, GST mapping, coupons, inventory defaults and an admin key.
- `lib/store.js` synchronously reads/writes the whole `data/db.json` file.

## Module map

- `routes/customers.js`: Lists customer accounts/recent settlements and records Khata settlements.
- `routes/orders.js`: Lists, retrieves, creates and cancels orders.
- `routes/products.js`: Lists/filters products and lists active coupons.
- `routes/reports.js`: Dashboard, GST reconciliation, pricing preview and key-guarded database export.
- `lib/coupons.js`: Normalizes/validates coupon codes, calculates discounts and lists active coupons.
- `lib/dates.js`: Formats DD/MM/YYYY dates, normalizes date keys and produces fiscal-year labels.
- `lib/inventory.js`: Finds products, checks sellable stock, deducts/restores physical stock and summarizes inventory.
- `lib/invoice.js`: Independently recalculates invoice figures and renders printable HTML with a total-mismatch notice.
- `lib/ledger.js`: Customer balances, credit-limit checks, Khata charges/reversals and settlement records.
- `lib/orders.js`: Adds, retrieves, filters and cancels orders; invokes inventory/Khata cancellation side effects.
- `lib/pricing.js`: Subtotals, coupon allocation, per-line post-discount GST and cart totals.
- `lib/reports.js`: Dashboard summaries and saved-order versus recalculated-invoice reconciliation.
- `lib/store.js`: JSON-file persistence, missing top-level structure defaults and a capped audit log.
- `lib/tax.js`: Numeric GST overrides, exact HSN-key lookup, fallback rate and CGST/SGST splitting.

## Commands

- Start the app: `node server.js` (also available as `npm start`).
- Run tests: `node --test` using the built-in test runner.
- `npm test` currently prints "Error: no test specified" and exits with status 1.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Allow purchases of exactly the remaining sellable stock; never exceed it, including across duplicate cart lines.
- Cancelling an order restores its sold quantities to physical stock exactly once and preserves reservations.
- Allowed production files: `lib/inventory.js`; `lib/orders.js` (cancellation only).
- Regression tests: `test/inventory.test.js`, using in-memory products and orders.
