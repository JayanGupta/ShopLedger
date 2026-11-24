# ShopLedger

## Stack

Node.js with Express 4 and body-parser; a static browser UI in `public/`; JSON-file persistence in `data/db.json`.

## Module map

- `routes/products.js` — product and active-coupon read endpoints.
- `routes/orders.js` — order list/detail/create and cancellation endpoints.
- `routes/customers.js` — customer/settlement read and settlement creation endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and export endpoints.
- `lib/coupons.js` — coupon normalization, validation, calculation, and listing.
- `lib/dates.js` — current date, date normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable-stock check, stock reserve/release, and summary.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — Khata customer lookup, charging, reversal, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and listing.
- `lib/pricing.js` — subtotal, discount, and GST total calculations.
- `lib/reports.js` — dashboard summary and GST reconciliation.
- `lib/store.js` — reads, writes, and audits the JSON datastore.
- `lib/tax.js` — GST-rate lookup, slab percentage, and CGST/SGST split.

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

Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.

Allowed files: `lib/inventory.js`, and `lib/orders.js` (cancel only).
