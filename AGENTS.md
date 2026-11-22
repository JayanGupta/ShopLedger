# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Application data persists in `data/db.json` through `lib/store.js`. Settings live in `config.js`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing previews, and database export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats today's date, normalizes dates for comparison, and computes fiscal years.
- `lib/inventory.js` finds products, checks stock, reserves and releases stock, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, order charges, reversals, and settlements.
- `lib/orders.js` adds, retrieves, cancels, and filters orders.
- `lib/pricing.js` applies coupon discounts and calculates order totals with per-item GST.
- `lib/reports.js` summarizes dashboard metrics and compares invoice figures with stored order totals.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start`. The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The repository has no test files yet. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
