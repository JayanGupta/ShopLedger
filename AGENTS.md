# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Express serves plain HTML, CSS, and JavaScript from `public/` and mounts the routers under `/api`.
- `lib/store.js` synchronously reads and writes the JSON database at `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements, and records settlement payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and data export.
- `lib/coupons.js` normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` formats the current date, normalizes date inputs, and derives fiscal year labels.
- `lib/inventory.js` looks up products, checks sellable stock, applies stock and reservation changes, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` looks up customers, calculates Khata balances, applies or reverses order charges, and records settlements.
- `lib/orders.js` creates, retrieves, cancels, and lists orders with optional filters.
- `lib/pricing.js` calculates checkout totals, allocating coupon discounts across lines before GST.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with saved order figures.
- `lib/store.js` initializes missing database fields, reads and writes JSON, and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js`. It listens on `PORT` or defaults to `3000`.
- Run tests with `node --test`. The repository currently has no test files, and the package test script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Order history sorting and date filtering compare day-first date strings lexicographically, which breaks chronological comparisons across months and years.
- Khata settlements can corrupt customer balances because the route passes the amount through and the ledger adds it to `totalSettled` before numeric conversion. The browser submits the amount as a string.
- Allowed files are `lib/orders.js` (`list()` only), `lib/dates.js`, `lib/ledger.js`, and `routes/customers.js`.
