# ShopLedger

## Stack
- Node.js with CommonJS modules.
- Express 4 and `body-parser` parse JSON requests.
- Browser UI uses static HTML, CSS, and JavaScript from `public/`.
- Runtime data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers/settlements and records Khata settlements.
- `routes/orders.js` — lists, retrieves, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — pricing preview, dashboard, GST reconciliation, and admin export.
- `lib/coupons.js` — normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers, updates Khata balances, and records settlements.
- `lib/orders.js` — adds, retrieves, cancels, and filters orders.
- `lib/pricing.js` — computes subtotals, discounts, line GST, and checkout totals.
- `lib/reports.js` — computes dashboard summaries and GST reconciliation.
- `lib/store.js` — reads/writes JSON data and appends audit records.
- `lib/tax.js` — resolves GST rates/slabs and splits GST into CGST and SGST.

## Commands
- Start the app: `npm start` (`node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Order history sorting and date filter are broken, and Khata settlements corrupt customer balances. Allowed files: `lib/orders.js` (list only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
