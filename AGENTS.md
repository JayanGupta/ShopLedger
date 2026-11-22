# ShopLedger

## Stack

Node.js with Express 4, `body-parser`, a static browser UI, and a JSON file store.

## Module map

- `routes/products.js` — lists products and active coupons.
- `routes/orders.js` — lists, creates, and cancels orders.
- `routes/customers.js` — lists customers and records Khata settlements.
- `routes/reports.js` — serves dashboard, GST reconciliation, pricing preview, and export data.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — creates and normalizes Indian-format dates and fiscal years.
- `lib/inventory.js` — finds products and checks, reserves, releases, and summarizes stock.
- `lib/invoice.js` — calculates invoice figures and renders invoice HTML.
- `lib/ledger.js` — manages customer balances, Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotals, discounts, GST totals, and line breakdowns.
- `lib/reports.js` — calculates dashboard and GST-reconciliation data.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits CGST/SGST.

## Commands

- Start the app: `node server.js`
- Run tests: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
