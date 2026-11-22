# AGENTS.md

## Stack

Node.js CommonJS application using Express and body-parser. The browser UI is vanilla HTML/CSS/JavaScript in `public/`; persistence is JSON in `data/db.json`.

## Module map

- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, placement, lookup, and cancellation endpoints.
- `routes/products.js` — product and active-coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, listing, and discount calculation.
- `lib/dates.js` — date formatting, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, stock checks, stock reservation/release, and summaries.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer lookup, Khata charging/reversal, listing, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, GST-aware order totals, and line breakdowns.
- `lib/reports.js` — dashboard summary and invoice-versus-ledger GST reconciliation.
- `lib/store.js` — JSON database read/write, structure defaults, and audit entries.
- `lib/tax.js` — item GST-rate resolution and CGST/SGST splitting.

## Commands

- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
