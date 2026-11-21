# ShopLedger

## Stack
- Node.js app with Express 4 (`^4.17.1`) and `body-parser` (`^1.19.0`).
- `server.js` serves `public/`, mounts JSON API routers under `/api`, and serves printable HTML invoices.
- Persistent application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists Khata customers and settlements; records customer settlements.
- `routes/orders.js` — lists, fetches, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, and calculates configured coupon discounts.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks and changes stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable HTML.
- `lib/ledger.js` — finds customers and updates Khata billing, reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — computes subtotal, discount, tax, and order totals.
- `lib/reports.js` — computes dashboard summaries and GST reconciliation data.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates from item rates/HSN slabs and splits CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (the repository currently has no test files; `npm test` is a placeholder that exits with an error).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
