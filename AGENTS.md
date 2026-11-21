# Repository Guidelines

## Stack

ShopLedger is a Node.js CommonJS app using Express and body-parser. Its browser UI is plain HTML, CSS, and JavaScript in `public/`. `lib/store.js` persists application data in `data/db.json`.

## Module Map

### `routes/`
- `customers.js` — lists customers and settlements; records customer settlements.
- `orders.js` — lists, retrieves, creates, and cancels orders.
- `products.js` — lists products and active coupons.
- `reports.js` — serves dashboard/GST reports, pricing preview, and admin export.

### `lib/`
- `coupons.js` — normalizes, validates, calculates, and lists coupons.
- `dates.js` — formats today’s date and normalizes date keys and fiscal years.
- `inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `invoice.js` — computes invoice figures and renders printable invoice HTML.
- `ledger.js` — lists customers, charges/reverses Khata orders, and records settlements.
- `orders.js` — adds, finds, cancels, and filters orders.
- `pricing.js` — calculates subtotals, discounts, line GST, and order totals.
- `reports.js` — builds dashboard summaries and GST reconciliation.
- `store.js` — reads/writes `data/db.json` and appends audit entries.
- `tax.js` — resolves item GST rates and splits tax into CGST/SGST.

## Commands

- `npm start` — starts the app on `PORT`, or port 3000 by default.
- `node --test` — runs tests with Node’s built-in test runner. No test directory is present today; `npm test` is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data; never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current Ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed production files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
