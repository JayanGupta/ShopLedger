# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- `server.js` mounts the routers under `/api` and serves printable HTML invoices at `GET /orders/:id/invoice`.
- `config.js` holds app settings. `lib/store.js` persists data in `data/db.json`.

## Module map

- `routes/customers.js` lists customers and settlements and records Khata payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date inputs, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, applies stock changes, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML with a total mismatch notice.
- `lib/ledger.js` manages customer balances, Khata charges and reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals by allocating coupons across lines before GST.
- `lib/reports.js` summarizes dashboard metrics and compares stored order figures with invoice calculations.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (`npm start` runs the same command). The default port is 3000 unless `PORT` is set.
- Run tests with `node --test`. The repo currently has no test files, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Use in-memory data in tests. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
