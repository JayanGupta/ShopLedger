# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Plain HTML, CSS, and browser JavaScript served from `public/`.
- `lib/store.js` reads and writes the JSON store at `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products with stock and GST information and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and administrative export.
- `lib/coupons.js` normalizes codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats order date strings, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates inventory, and summarizes stock.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit checks, debit reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals, apportions coupon discounts, and applies line-level GST.
- `lib/reports.js` builds dashboard totals and compares saved order figures with recalculated invoice figures.
- `lib/store.js` reads and writes the JSON store and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start` (`npm.cmd start` in PowerShell if script execution is blocked).
- Run tests with `node --test`. The repository has no test files yet, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed. Checkout applies HSN-based GST after allocating coupon discounts. The printable invoice recalculates GST and discounts separately.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
