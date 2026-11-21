# ShopLedger

## Stack

- Node.js with CommonJS, Express (`^4.17.1`), and `body-parser` (`^1.19.0`).
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- `lib/store.js` reads and writes `data/db.json` synchronously.

## Module map

- `routes/customers.js` lists customers and recent settlements and records Khata payments.
- `routes/orders.js` lists and fetches orders, places orders, and handles cancellations.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and database export.
- `lib/coupons.js` normalizes codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up customers, charges and reverses Khata debits, and records settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` computes checkout totals by allocating coupon discounts and applying GST per line.
- `lib/reports.js` builds dashboard metrics and compares invoice figures with saved order amounts.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js` or `npm start`.
- Run tests from the repo root with `node --test`. There are currently no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. The invoice recalculates amounts separately from the saved checkout totals.

Allowed files: `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
