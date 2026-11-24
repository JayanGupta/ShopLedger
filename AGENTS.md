# ShopLedger Agent Guide

## Stack
- Node.js using CommonJS modules.
- Express 4 with `body-parser`; `server.js` serves the static vanilla HTML/CSS/JavaScript UI in `public/`.
- Persistence is synchronous JSON file I/O through `lib/store.js` to `data/db.json`.

## Module map
- `routes/customers.js` — lists customers and records Khata settlements.
- `routes/orders.js` — lists, fetches, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` — normalizes, validates, lists, and calculates coupon discounts.
- `lib/dates.js` — formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, calculates sellable stock, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes printable invoice figures and renders invoice HTML.
- `lib/ledger.js` — reads customer balances, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, retrieves, cancels, and filters orders.
- `lib/pricing.js` — computes subtotal, coupon discount, per-line GST, and checkout totals.
- `lib/reports.js` — builds dashboard summaries and compares stored totals with invoice figures.
- `lib/store.js` — reads/writes `data/db.json`, ensures its structure, and appends audit entries.
- `lib/tax.js` — resolves GST rates and HSN slabs and splits GST into CGST and SGST.

## Commands
- Start the app: `npm start`
- Run tests: `node --test`

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
