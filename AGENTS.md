# ShopLedger Agent Guide

## Stack
- Node.js using CommonJS modules.
- Express 4 with `body-parser` for JSON requests.
- Vanilla HTML, CSS, and browser JavaScript under `public/`.
- Synchronous JSON-file persistence through `lib/store.js` to `data/db.json`.

## Module map
- `routes/customers.js`: Lists customers and records Khata settlements.
- `routes/orders.js`: Lists, reads, creates, and cancels orders.
- `routes/products.js`: Lists products and active coupons.
- `routes/reports.js`: Serves dashboard and GST reports, pricing previews, and admin export.
- `lib/coupons.js`: Normalizes, validates, lists, and calculates coupons.
- `lib/dates.js`: Formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js`: Finds products, calculates sellable stock, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js`: Recomputes invoice figures and renders printable invoice HTML.
- `lib/ledger.js`: Reads customer balances, charges/reverses Khata, and records settlements.
- `lib/orders.js`: Adds, gets, cancels, and filters orders.
- `lib/pricing.js`: Calculates subtotals, discounts, GST, and order totals.
- `lib/reports.js`: Builds dashboard summaries and GST reconciliation reports.
- `lib/store.js`: Reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js`: Resolves GST rates and splits GST into CGST and SGST.

## Commands
- Start the app: `node server.js`
- Run tests: `node --test`
- There are currently no test files in the repository.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
- Allowed files: `lib/inventory.js`, and `lib/orders.js` (`cancel` only).
