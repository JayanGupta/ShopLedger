# ShopLedger

## Stack

- CommonJS JavaScript on Node.js with Express and body-parser.
- Static browser UI in `public/` (HTML, CSS, and JavaScript).
- JSON persistence in `data/db.json` through synchronous filesystem reads and writes.

## Module map

- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, retrieval, creation, and cancellation endpoints.
- `routes/products.js` — product catalog and active-coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, calculation, and listing.
- `lib/dates.js` — date formatting, normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, stock checks, reservation, release, and stock summaries.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — Khata customer lookup, billing, reversal, and settlement logic.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, GST, and order total calculation.
- `lib/reports.js` — dashboard and invoice-versus-ledger GST reconciliation.
- `lib/store.js` — `data/db.json` structure, reads, writes, and audit-log appends.
- `lib/tax.js` — GST-rate resolution and CGST/SGST splitting.

## Commands

- `node server.js` — start the app.
- `node --test` — run Node's test runner; no test files are currently checked in.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
