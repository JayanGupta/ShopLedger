# ShopLedger Agent Notes

## Stack
- Node.js app using Express `^4.17.1` and body-parser `^1.19.0` (package.json).
- Browser UI is static HTML, CSS, and JavaScript served from `public/` (server.js).
- Application data is read from and written to `data/db.json` via `lib/store.js`.

## Module map
- `routes/products.js` — serves products and active coupons.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/customers.js` — lists customers/settlements and records Khata settlements.
- `routes/reports.js` — serves dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal year.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — lists customers and manages Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — computes subtotals, discounts, and checkout totals.
- `lib/reports.js` — builds dashboard summary and GST reconciliation data.
- `lib/store.js` — reads/writes the JSON store and appends audit entries.
- `lib/tax.js` — resolves item GST rates/slabs and splits CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`. `package.json` currently defines `npm test` as a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
