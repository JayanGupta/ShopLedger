# ShopLedger

## Stack

- Node.js application using Express 4 and `body-parser`; the server entry point is `server.js`.
- Static browser UI is served from `public/`; application state is persisted in `data/db.json`.
- The app is a POS, inventory, Khata ledger, GST, reporting, and printable HTML invoice system.

## Module map

- `routes/customers.js` — customer balances and Khata settlement HTTP endpoints.
- `routes/orders.js` — order list/detail/create/cancel HTTP endpoints.
- `routes/products.js` — product catalog and active-coupon HTTP endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and active-coupon listing.
- `lib/dates.js` — Indian date formatting, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable-stock checks, reserve/release, and inventory summary.
- `lib/invoice.js` — printable invoice figure calculation and HTML rendering.
- `lib/ledger.js` — customer lookup, balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering/listing.
- `lib/pricing.js` — subtotal, coupon discount, and checkout totals calculation.
- `lib/reports.js` — dashboard summary and ledger-to-invoice GST reconciliation.
- `lib/store.js` — JSON database read/write and audit-log append.
- `lib/tax.js` — item GST-rate resolution, slab percentage, and CGST/SGST split.

## Commands

- Start the app: `node server.js`
- Run tests: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
