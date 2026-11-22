# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4 and body-parser. `server.js` serves the API and the static HTML, CSS and JavaScript in `public/`.
- `config.js` defines shop settings, GST slabs and coupon rules. `lib/store.js` persists application data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements, and records customer payments.
- `routes/orders.js` handles checkout, order lookup, filtering and cancellation.
- `routes/products.js` lists and filters products with sellable stock and GST rates, and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview and admin data export.
- `lib/coupons.js` normalises coupon codes, checks eligibility and calculates flat or percentage discounts.
- `lib/dates.js` formats local dates as DD/MM/YYYY, normalises date strings and computes fiscal-year labels.
- `lib/inventory.js` checks sellable stock, deducts physical stock for orders and summarises inventory.
- `lib/invoice.js` calculates printable invoice figures and renders the HTML invoice.
- `lib/ledger.js` calculates Khata balances, checks credit limits, charges or reverses orders and records settlements.
- `lib/orders.js` assigns order IDs, stores order records in memory, retrieves and filters them, and handles cancellation.
- `lib/pricing.js` allocates coupon discounts across lines, calculates GST on discounted amounts and returns checkout totals.
- `lib/reports.js` builds dashboard summaries and compares saved order tax and totals with invoice figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates from an explicit rate, an HSN slab or the configured default, and splits GST into CGST and SGST.

## Commands

- Start the app from the repository root with `npm start`. This runs `node server.js` and defaults to port 3000.
- Run tests from the repository root with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket covers.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice must match what checkout billed. Both paths use `pricing.computeTotals()`. If current rules produce different figures, the reprint shows the saved amounts and marks the historical per-item GST breakdown as unavailable.

Limit changes to `lib/invoice.js`. Change `lib/tax.js` only if the fix requires it.
