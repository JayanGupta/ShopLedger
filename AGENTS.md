# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Local JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` — Lists customers and recent settlements and records Khata repayments.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists and filters products and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, pricing previews, and database export.
- `lib/coupons.js` — Normalizes coupon codes, validates coupon rules, and calculates discounts.
- `lib/dates.js` — Formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` — Looks up products, checks sellable stock, deducts stock, releases holds, and summarizes inventory.
- `lib/invoice.js` — Calculates invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — Looks up customers, tracks Khata balances, charges and reverses orders, and records repayments.
- `lib/orders.js` — Adds, retrieves, filters, and cancels orders.
- `lib/pricing.js` — Calculates subtotals, discounts, line-level GST, and order totals.
- `lib/reports.js` — Builds dashboard summaries and compares invoice figures with saved order totals and tax.
- `lib/store.js` — Reads and writes the JSON database and appends audit entries.
- `lib/tax.js` — Resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js`. The default port is 3000, and `PORT` overrides it.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Cannot sell the last sellable unit. `inventory.check()` rejects a quantity equal to sellable stock.
- Cancelling an order never restores physical stock. `orders.cancel()` calls `inventory.release()`, which looks up `item.productId` instead of the stored `item.id` and only adjusts `reserved`.
- Allowed files for the fix are `lib/inventory.js` and `lib/orders.js` (only `cancel()`).
