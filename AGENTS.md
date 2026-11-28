# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript under `public/`.
- Persistent application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and settlements; records customer settlements.
- `routes/orders.js` — lists, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and keyed data export.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — supplies today's date and normalizes date keys; derives fiscal year.
- `lib/inventory.js` — finds products, checks and adjusts stock, and summarizes inventory.
- `lib/invoice.js` — calculates invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — manages customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — adds, finds, lists, and cancels orders.
- `lib/pricing.js` — computes order subtotal, discount, and tax-inclusive totals.
- `lib/reports.js` — builds dashboard summaries and GST reconciliation results.
- `lib/store.js` — reads/writes JSON data and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Invariants
- `lib/invoice.js` computes invoice figures from the order's items with `pricing.computeTotals`. It never copies the stored `subtotal`/`discount`/`tax`/`total`, because GST reconciliation (`lib/reports.js`) compares the two to catch mismatches.

## Current ticket
None. Last closed: #1, invoice total and GST breakdown did not match what the customer was billed (fixed on `fix/invoice-gst-mismatch`).
