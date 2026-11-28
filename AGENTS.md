# ShopLedger — project notes for Codex

## Stack
- Node.js + Express (no build step, no framework, no database server)
- Plain HTML/CSS/JS frontend in `public/`, served by the same server
- All data stored in one local JSON file: `data/db.json`
- Start: `npm install` once, then `npm start` → http://localhost:3000

## Module map
- `server.js` — starts Express, serves `public/`, mounts the `/api` routes, renders printable invoices
- `config.js` — shop details, HSN GST slabs, default GST rate, coupon definitions
- `routes/products.js` — product catalog and coupon endpoints
- `routes/orders.js` — create, list, view and cancel orders
- `routes/customers.js` — customer khata balances and settlements
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, admin export
- `lib/inventory.js` — stock availability and stock changes
- `lib/pricing.js` — checkout totals: subtotal, coupon discount apportioned per line, GST on post-discount value
- `lib/tax.js` — GST rate per item (HSN slab or `gstRate`), CGST/SGST split
- `lib/coupons.js` — coupon validation and discount (min order, max-discount cap)
- `lib/ledger.js` — customer credit (khata) balances and repayments
- `lib/orders.js` — order creation, filtering and cancellation rules
- `lib/invoice.js` — printable GST invoice figures and HTML
- `lib/reports.js` — dashboard figures and invoice-versus-ledger checks
- `lib/store.js` — reads and writes `data/db.json`
- `lib/dates.js` — date helpers

## Commands
- Run the app: `npm start`
- Run tests: `node --test` (the `npm test` script is a placeholder and fails on purpose)

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the current ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data only.
4. Add no new dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
GST Audit flags 7 of 8 orders; only #1008 matches checkout.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
