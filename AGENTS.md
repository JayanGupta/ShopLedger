# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Synchronous JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` — Lists customers and records Khata settlements.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists products and active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and admin exports.
- `lib/coupons.js` — Normalizes and validates coupon codes and computes discounts.
- `lib/dates.js` — Formats dates, normalizes date inputs, and derives fiscal years.
- `lib/inventory.js` — Finds products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — Recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` — Tracks Khata charges, reversals, balances, and settlements.
- `lib/orders.js` — Creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Computes checkout totals with coupon allocation and line GST.
- `lib/reports.js` — Builds dashboard summaries and compares invoice figures with saved order figures.
- `lib/store.js` — Reads and writes the JSON database and appends audit entries.
- `lib/tax.js` — Resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js`).
- Run tests with `node --test`. There are currently no repository tests, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Change `lib/invoice.js`. Change `lib/tax.js` only if truly needed.
