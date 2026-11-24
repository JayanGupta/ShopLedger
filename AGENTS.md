# ShopLedger contributor guide

## Stack
- Node.js CommonJS app using Express 4 and body-parser; `server.js` serves `public/` and mounts API routes.
- Browser UI is plain HTML, CSS, and JavaScript. `lib/store.js` persists application data in `data/db.json`.

## Module map
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/orders.js` — list, get, place, and cancel orders.
- `routes/customers.js` — customer list and Khata settlement endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon lookup, validation, discount calculation, and listing.
- `lib/dates.js` — today's date, date-key normalization, and fiscal-year label.
- `lib/inventory.js` — product lookup, sellable-stock checks, stock changes, and summary.
- `lib/invoice.js` — recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` — customer lookup, Khata charges and reversals, and settlements.
- `lib/orders.js` — add, get, cancel, and list orders.
- `lib/pricing.js` — subtotal, coupon discount, and checkout totals with line-level GST.
- `lib/reports.js` — dashboard summary and GST reconciliation against invoice figures.
- `lib/store.js` — read/write `data/db.json` and append audit entries.
- `lib/tax.js` — resolve item GST rate and split tax into CGST and SGST.

## Commands
- Start the app: `node server.js` (`npm start` runs the same command).
- Run tests: `node --test`. No test files are present today; `npm test` is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
