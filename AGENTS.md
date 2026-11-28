# ShopLedger Agent Instructions

## Stack
- Node.js CommonJS application using Express and body-parser.
- Browser UI is static HTML, CSS, and vanilla JavaScript in `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, creation, and cancellation endpoints.
- `routes/products.js` — product search/listing and active coupon endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and data export endpoints.
- `lib/coupons.js` — coupon lookup, validation, and discount calculation.
- `lib/dates.js` — current-date formatting, date normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable stock, availability checks, reservation, and summaries.
- `lib/invoice.js` — invoice calculations and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata billing, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, discounts, tax totals, and line breakdowns.
- `lib/reports.js` — dashboard metrics and GST reconciliation.
- `lib/store.js` — JSON database read/write, structure defaults, and audit log updates.
- `lib/tax.js` — GST rate resolution and CGST/SGST splitting.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Order history sorting and date filtering are broken, and Khata settlements corrupt customer balances.

Allowed files: `lib/orders.js` (list only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
