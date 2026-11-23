# ShopLedger

## Stack

Node.js CommonJS application using Express 4 and body-parser. It serves static files from `public/`, exposes API routes under `/api`, and persists data in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` — customer list and Khata settlement endpoints.
- `routes/orders.js` — order listing, creation, and cancellation endpoints.
- `routes/products.js` — product listing and active-coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and protected export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discounts, and active-coupon listing.
- `lib/dates.js` — Indian date formatting, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable-stock checks, stock changes, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML invoice rendering.
- `lib/ledger.js` — customer Khata balances, charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — cart subtotal, coupon discount, per-line GST, and totals calculation.
- `lib/reports.js` — dashboard totals and ledger-versus-invoice GST reconciliation.
- `lib/store.js` — synchronous JSON database reads, writes, structure initialization, and audit logging.
- `lib/tax.js` — GST-rate resolution and CGST/SGST splitting.

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

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
