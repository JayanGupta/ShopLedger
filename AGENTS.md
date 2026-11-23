# ShopLedger

## Stack

- Node.js CommonJS application using Express 4 and body-parser.
- Static browser UI is served from `public/`; persistence is JSON in `data/db.json`.
- Entry point: `server.js`; configuration: `config.js`.

## Module map

- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, creation, lookup, and cancellation endpoints.
- `routes/products.js` — product and active-coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock checks, stock reservation/release, and summaries.
- `lib/invoice.js` — printable HTML invoice calculations and rendering.
- `lib/ledger.js` — customer balances, Khata charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotals, discounts, line GST, and order totals.
- `lib/reports.js` — dashboard summary and stored-order versus invoice reconciliation.
- `lib/store.js` — synchronous JSON database read/write and audit-log append.
- `lib/tax.js` — HSN/default GST rate resolution and CGST/SGST splitting.

## Commands

- Start the app: `node server.js` (also available as `npm start`).
- Run tests: `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
