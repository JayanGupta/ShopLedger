# Repository Guidelines

## Stack

Node.js with CommonJS, Express 4, and body-parser for JSON requests. Express serves plain HTML, CSS, and JavaScript from `public/`. The app stores its data in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and records settlements.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists products and active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and admin exports.
- `lib/coupons.js` — Normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` — Formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` — Looks up products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — Looks up customers and handles Khata balances, debits, reversals, and settlements.
- `lib/orders.js` — Creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Computes checkout totals, allocates coupons across lines, and applies GST.
- `lib/reports.js` — Aggregates dashboard figures and compares invoice figures with stored order totals and GST.
- `lib/store.js` — Reads and writes the JSON database and appends audit records.
- `lib/tax.js` — Resolves GST rates and splits GST into CGST and SGST.

## Commands

- `npm start` runs `node server.js`. The default port is 3000 and `PORT` overrides it.
- `node --test` runs tests with Node's built-in runner. The repository currently has no test files, and `npm test` exits with a placeholder error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Tests must use in-memory data. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed. Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
