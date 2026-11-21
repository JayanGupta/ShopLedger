# ShopLedger Repository Guide

## Stack

- Node.js CommonJS application using Express and `body-parser`.
- File-backed JSON data store at `data/db.json`; browser assets are in `public/`.

## Module map

- `routes/products.js`: product catalogue and stock endpoints.
- `routes/orders.js`: order creation, listing, and cancellation endpoints.
- `routes/customers.js`: Khata customer and settlement endpoints.
- `routes/reports.js`: dashboard, GST reconciliation, and pricing-preview endpoints.
- `lib/coupons.js`: coupon normalization, validation, and discount calculation.
- `lib/dates.js`: Indian date utilities and sortable date keys.
- `lib/inventory.js`: stock lookup, sellability, reservations, and summaries.
- `lib/invoice.js`: invoice calculations and printable invoice HTML.
- `lib/ledger.js`: Khata balances, order debits, and settlements.
- `lib/orders.js`: in-memory order creation, lookup, filtering, and cancellation.
- `lib/pricing.js`: checkout subtotal, discount, GST, and totals calculation.
- `lib/reports.js`: dashboard and invoice-reconciliation report calculations.
- `lib/store.js`: reads and writes `data/db.json` and audit records.
- `lib/tax.js`: GST slab lookup and CGST/SGST split helpers.

## Commands

- Install dependencies: `npm.cmd install`
- Start the app: `npm.cmd start`
- Run tests: `node --test`

## Rules

1. Write characterization or regression tests before changing behaviour.
2. Change only modules relevant to the active ticket.
3. Tests must use in-memory data; never read or write `data/db.json`.
4. Add no dependencies unless explicitly approved.
5. Make the smallest fix that works and preserve the existing CommonJS style.
6. Do not commit `package-lock.json` unless the task explicitly changes dependencies.

## Current tickets

- #1 Invoice/GST mismatch: `lib/invoice.js` (with existing pricing/tax helpers as references).
- #3 Order history/Khata: `lib/dates.js`, `lib/orders.js` listing logic, and `lib/ledger.js`.
