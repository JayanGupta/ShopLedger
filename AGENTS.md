# ShopLedger contributor notes

## Stack

- Node.js CommonJS app using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript under public/.
- Runtime data is stored in data/db.json through lib/store.js.

## Module map

### routes/

- routes/customers.js — lists customers and recent settlements; records Khata settlements.
- routes/orders.js — lists, reads, creates, and cancels orders.
- routes/products.js — lists products and active coupons.
- routes/reports.js — dashboard and GST reports, pricing preview, and admin export.

### lib/

- lib/coupons.js — normalizes, validates, calculates, and lists coupons from config.
- lib/dates.js — formats today’s date, normalizes date keys, and derives fiscal years.
- lib/inventory.js — finds products, calculates sellable stock, checks stock, deducts order stock, releases holds, and summarizes inventory.
- lib/invoice.js — computes invoice figures and renders printable invoice HTML.
- lib/ledger.js — lists customers, charges/reverses Khata orders, and records settlements.
- lib/orders.js — adds, finds, cancels, and filters orders.
- lib/pricing.js — calculates subtotals, discounts, and order totals.
- lib/reports.js — computes dashboard summaries and GST reconciliation.
- lib/store.js — reads and writes data/db.json and appends audit entries.
- lib/tax.js — resolves GST rates from item data/config and splits CGST/SGST.

## Commands

- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`. No test files or test-specific script are currently listed in package.json.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.

Allowed files: `lib/inventory.js`, and `lib/orders.js` (cancel only).

