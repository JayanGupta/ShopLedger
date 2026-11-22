# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`. `server.js` serves the UI and printable GST invoices and mounts the API under `/api`.
- `config.js` holds shop settings, GST rates, and coupon rules. `data/db.json` stores application data.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date inputs, and derives fiscal-year labels.
- `lib/inventory.js` calculates sellable stock, checks availability, deducts physical stock, handles release, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` handles customer lookup, Khata charges and reversals, balances, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates subtotals, discounts, GST, and checkout totals.
- `lib/reports.js` summarizes dashboard metrics and compares invoice figures with saved order totals.
- `lib/store.js` reads and writes the JSON database synchronously and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start from the repo root with `node server.js`. The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- The last sellable unit cannot be sold because `inventory.check()` rejects `qty >= sellable`.
- Cancelling an order never restores physical stock. Placement deducts `stock` using line-item `id`. Cancellation calls `inventory.release()`, which looks up `productId` and only reduces `reserved` when a product matches.
- Allowed files are `lib/inventory.js` and `lib/orders.js` (`cancel()` only).
