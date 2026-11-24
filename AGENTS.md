# ShopLedger

## Stack

Node.js with CommonJS, Express 4 and body-parser. The browser UI uses plain HTML, CSS and JavaScript from `public/`. The app stores its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements, and records settlement payments.
- `routes/orders.js` lists, retrieves, places and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews and database export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats local dates as `DD/MM/YYYY`, normalizes filter inputs and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, changes stock or reservations and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` lists customer balances, charges and reverses Khata debits, and records settlements.
- `lib/orders.js` creates, retrieves, cancels, filters and sorts orders.
- `lib/pricing.js` computes cart subtotals, discounts, GST and totals.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with stored order figures.
- `lib/store.js` reads and rewrites the JSON store and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js` (also available as `npm start`).
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Order history sorts and filters `DD/MM/YYYY` strings lexicographically, which breaks chronological results.
- Khata settlements can corrupt balances because a string amount is added directly to `totalSettled`.
- Allowed files are `lib/orders.js` (`list()` only), `lib/dates.js`, `lib/ledger.js` and `routes/customers.js`.
