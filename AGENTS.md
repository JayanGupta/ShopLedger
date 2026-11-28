# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON request bodies.
- Static HTML, CSS, and vanilla JavaScript in `public/`, served by `server.js`.
- JSON file storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements, and records settlements.
- `routes/orders.js` lists, fetches, creates, and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and admin data export.
- `lib/coupons.js` normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` formats and normalizes dates and derives fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML invoices.
- `lib/ledger.js` manages Khata customer balances, order debits, reversals, and settlements.
- `lib/orders.js` creates, looks up, filters, and cancels orders in the supplied data object.
- `lib/pricing.js` computes order totals with proportional coupon discounts and per-line GST.
- `lib/reports.js` builds dashboard summaries and compares stored order figures with invoice figures.
- `lib/store.js` reads and writes the JSON data file, supplies missing defaults, and appends audit entries.
- `lib/tax.js` resolves GST rates from item overrides or HSN codes with a configured fallback, and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (`node server.js`). The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
