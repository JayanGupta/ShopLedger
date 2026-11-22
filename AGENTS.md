# ShopLedger contributor notes

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored as JSON in `data/db.json` through `lib/store.js`.

## Module map
### routes/
- `routes/customers.js` — lists customers and settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and export endpoints.
### lib/
- `lib/coupons.js` — normalizes, validates, and calculates coupon discounts.
- `lib/dates.js` — formats today’s date, normalizes date keys, and calculates fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, adjusts stock/reservations, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — lists customers, charges/reverses Khata debits, and records settlements.
- `lib/orders.js` — creates, finds, cancels, and lists orders.
- `lib/pricing.js` — calculates subtotals, discounts, and order totals.
- `lib/reports.js` — calculates dashboard summaries and GST reconciliation.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
- Allowed files: `lib/inventory.js`, and `lib/orders.js` (`cancel` only).
