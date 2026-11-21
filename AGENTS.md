# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Synchronous JSON storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and data export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats and normalizes date strings and derives fiscal years.
- `lib/inventory.js` calculates sellable stock, checks quantities, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` computes printable invoice figures and renders invoice HTML.
- `lib/ledger.js` computes Khata balances, applies and reverses order charges, and records settlements.
- `lib/orders.js` creates, retrieves, cancels, filters, and sorts order records.
- `lib/pricing.js` computes checkout totals, allocating coupon discounts before line-level GST.
- `lib/reports.js` builds dashboard summaries and compares stored order figures with recomputed invoice figures.
- `lib/store.js` reads and writes the JSON store and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (also available as `npm start`).
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
