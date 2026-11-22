# ShopLedger

## Stack
- Node.js with Express 4 and body-parser; browser UI is plain HTML, CSS, and JavaScript.
- `server.js` serves `public/`, mounts the API routers, and renders printable HTML invoices.
- `lib/store.js` reads and rewrites `data/db.json` as the app's JSON store.

## Module map
- `routes/products.js` — list products and active coupons.
- `routes/orders.js` — list, fetch, place, and cancel orders.
- `routes/customers.js` — list customers and record Khata settlements.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalize, validate, calculate, and list coupons.
- `lib/dates.js` — format dates, normalize date keys, and determine fiscal years.
- `lib/inventory.js` — find products, check sellable stock, reserve/release units, and summarize inventory.
- `lib/invoice.js` — compute invoice figures and render printable HTML.
- `lib/ledger.js` — find customers, calculate balances, charge/reverse Khata orders, and record settlements.
- `lib/orders.js` — add, find, cancel, and list orders.
- `lib/pricing.js` — compute subtotals, coupon discounts, and checkout totals.
- `lib/reports.js` — compute dashboard and GST reconciliation summaries.
- `lib/store.js` — read/write the JSON store and append audit entries.
- `lib/tax.js` — resolve item GST rates and split CGST/SGST.

## Commands
- Start the app: `node server.js` (also available as `npm start`).
- Run Node's built-in test runner: `node --test`. No test files currently exist; `npm test` is a placeholder in `package.json`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
