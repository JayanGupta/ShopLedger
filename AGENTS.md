# ShopLedger

## Stack

- Node.js application using Express and body-parser.
- `server.js` serves the static browser UI in `public/` and mounts API routers at `/api`.
- Persistence is JSON-file based: `data/db.json` is read and written by `lib/store.js`.

## Module map

- `routes/products.js` — lists products and active coupons.
- `routes/orders.js` — lists, creates, and cancels orders.
- `routes/customers.js` — lists customers/settlements and records settlements.
- `routes/reports.js` — supplies dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats dates, normalizes date keys, and determines fiscal years.
- `lib/inventory.js` — finds products and checks, reserves, releases, and summarizes stock.
- `lib/invoice.js` — calculates invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers and manages Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, gets, cancels, and lists orders.
- `lib/pricing.js` — calculates subtotals, coupon discounts, tax, and checkout totals.
- `lib/reports.js` — calculates dashboard values and GST reconciliation data.
- `lib/store.js` — reads/writes the JSON database and appends audit entries.
- `lib/tax.js` — resolves GST rates/slabs and splits CGST/SGST.

## Commands

- Start the app: `npm start` (runs `node server.js`).
- Run Node's test runner: `node --test`.
- No test files are currently present in the repository.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
