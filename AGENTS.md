# ShopLedger

## Stack

- Node.js application using Express 4 and body-parser; browser UI is static HTML, CSS, and JavaScript in `public/`.
- The server reads and writes application data in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` — lists customers and recent settlements; records a customer settlement.
- `routes/orders.js` — lists and fetches orders; places and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard and GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons from config.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds customers, calculates Khata balances, charges/reverses order debits, and records settlements.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotals, coupon discounts, GST, and checkout totals.
- `lib/reports.js` — builds dashboard summaries and compares stored order totals with invoice figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates from item data/config and splits tax into CGST and SGST.

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
