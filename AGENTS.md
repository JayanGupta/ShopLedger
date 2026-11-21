# ShopLedger

## Stack
- Node.js CommonJS app using Express and body-parser; `server.js` serves the static HTML, CSS, and JavaScript in `public/`.
- `lib/store.js` reads and writes the JSON database at `data/db.json`.

## Module map
- `routes/products.js` — lists and searches products; lists active coupons.
- `routes/orders.js` — lists, gets, creates, and cancels orders.
- `routes/customers.js` — lists customers and records Khata settlements.
- `routes/reports.js` — serves dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes and validates coupons, calculates discounts, and lists active coupons.
- `lib/dates.js` — formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, deducts stock, and provides release and summary helpers.
- `lib/invoice.js` — calculates invoice figures and renders the printable HTML invoice.
- `lib/ledger.js` — finds customers and manages Khata balances, charges, reversals, and settlements.
- `lib/orders.js` — adds, gets, cancels, and lists order records.
- `lib/pricing.js` — computes subtotals, coupon discounts, and line-level GST totals after discount.
- `lib/reports.js` — computes dashboard summaries and GST reconciliation.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates and splits tax into CGST and SGST.

## Commands
- Start the app: `node server.js` (the `npm start` script runs this command).
- Run tests: `node --test`. The current `npm test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
- Checkout stores totals from `lib/pricing.js`; `lib/invoice.js` calculates invoice figures separately.
