# ShopLedger Agent Guide

## Stack
- Node.js CommonJS application using Express 4 and body-parser; browser UI is HTML, CSS, and JavaScript.
- Persistent application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers/settlements and records Khata settlements.
- `routes/orders.js` — lists, creates, reads, and cancels orders.
- `routes/products.js` — lists/searches products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export routes.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — creates today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, adjusts stock, and summarizes inventory.
- `lib/invoice.js` — calculates and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers and updates Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and lists orders; current ticket permits changes to `list` only.
- `lib/pricing.js` — calculates subtotals, coupon discounts, GST totals, and line breakdowns.
- `lib/reports.js` — builds dashboard summaries and compares invoice/order GST figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit events.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.

## Commands
- Start the app: `node server.js`.
- Run tests: `node --test` (Node’s built-in test runner; no test files are currently present).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Order history sorting and date filtering are broken, and Khata settlements corrupt customer balances.
- Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
