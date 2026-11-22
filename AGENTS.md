# ShopLedger

## Stack

- Node.js CommonJS application with Express 4 and body-parser; entry point is `server.js`.
- Static browser UI is served from `public/`.
- Persistent state is stored as JSON in `data/db.json` through synchronous filesystem calls in `lib/store.js`.

## Module map

- `routes/customers.js`: customer listing and Khata settlement endpoints.
- `routes/orders.js`: order listing, creation, and cancellation endpoints.
- `routes/products.js`: product and active-coupon endpoints.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js`: coupon normalization, validation, listing, and discount calculation.
- `lib/dates.js`: date formatting, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js`: product lookup, stock checks, stock reservation/release, and inventory summaries.
- `lib/invoice.js`: printable invoice calculations and HTML rendering.
- `lib/ledger.js`: customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js`: order creation, lookup, cancellation, and filtering.
- `lib/pricing.js`: subtotal and checkout total calculations, including discounts and GST.
- `lib/reports.js`: dashboard summary and GST reconciliation calculations.
- `lib/store.js`: read, write, structure initialization, and audit-log persistence.
- `lib/tax.js`: GST-rate resolution, slab percentages, rounding, and CGST/SGST splitting.

## Commands

- Start the app: `npm start`
- Run tests: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
