# ShopLedger

## Stack

Node.js with Express and `body-parser`; a vanilla HTML/CSS/JavaScript browser UI; JSON-file persistence in `data/db.json`.

## Module map

- `routes/products.js` — product catalogue and active-coupon API endpoints.
- `routes/orders.js` — order list/get/create/cancel API endpoints.
- `routes/customers.js` — customer list and Khata-settlement API endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, calculation, and listing.
- `lib/dates.js` — Indian date formatting, normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable-stock checks, reserve/release, and summaries.
- `lib/invoice.js` — invoice calculation and printable HTML rendering.
- `lib/ledger.js` — customer lookup, Khata billing/reversal, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, and checkout total calculation.
- `lib/reports.js` — dashboard and invoice-versus-ledger GST reconciliation.
- `lib/store.js` — synchronous JSON database read/write and audit-log append.
- `lib/tax.js` — GST-rate lookup, slab percentage, and CGST/SGST split.

## Commands

- Start the app: `npm start`
- Run tests: `node --test` (there are currently no test files; `npm test` is not configured to run tests).

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
