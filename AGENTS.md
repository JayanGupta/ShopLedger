# ShopLedger

## Stack
- Node.js application using Express 4 and body-parser for JSON request bodies.
- Browser UI is HTML, CSS, and JavaScript in `public/`; server data is stored in `data/db.json`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, retrieval, placement, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and active coupon listing.
- `lib/dates.js` — Indian date formatting, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata order charges/reversals, and payment settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount delegation, and checkout totals.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — JSON database read/write, structure defaults, and audit entries.
- `lib/tax.js` — item GST rate/slab resolution and CGST/SGST splitting.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node's built-in test runner; no test files are currently present).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
