# ShopLedger contributor guide

## Stack

Node.js application using Express 4 and body-parser. `server.js` serves the static POS UI and JSON API; persisted application data is in `data/db.json`.

## Module map

### routes/
- `routes/customers.js` — customer listing and Khata settlements.
- `routes/orders.js` — order listing, creation, retrieval, and cancellation.
- `routes/products.js` — product catalog and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export.

### lib/
- `lib/coupons.js` — coupon normalization, validation, calculation, and listing.
- `lib/dates.js` — current date, date normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, stock checks, reservation, release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, and checkout total calculation.
- `lib/reports.js` — dashboard and GST-reconciliation calculations.
- `lib/store.js` — JSON database read, write, and audit-log append operations.
- `lib/tax.js` — GST-rate lookup and CGST/SGST splitting.

## Commands

- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (there are currently no test files).

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
