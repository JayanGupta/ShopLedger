# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser 1 for JSON requests.
- Plain HTML, CSS, and JavaScript served from `public/`.
- Synchronous JSON file storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart previews, and database exports.
- `lib/coupons.js` normalizes and validates coupon codes and computes discounts.
- `lib/dates.js` formats dates, normalizes date strings, and computes fiscal-year labels.
- `lib/inventory.js` finds products, checks stock, deducts sold units, releases reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, order debits, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, sorts, and cancels orders.
- `lib/pricing.js` computes checkout totals with proportional coupon allocation and line-level GST.
- `lib/reports.js` summarizes dashboard metrics and compares invoice figures with saved order totals and GST.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files are `lib/invoice.js` and `lib/tax.js` only if truly needed.
