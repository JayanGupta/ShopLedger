# ShopLedger

## Stack

Node.js with CommonJS, Express and body-parser. Express serves the HTML, CSS and browser JavaScript in `public/`. The app stores its records in `data/db.json`.

## Module map

- `routes/customers.js` lists customer accounts and recent settlements, and records repayments.
- `routes/orders.js` handles order creation, lookup, listing and cancellation.
- `routes/products.js` serves the product catalogue with sellable quantities and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview and admin data export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date strings for filters and derives fiscal years.
- `lib/inventory.js` checks sellable quantities, deducts stock, handles release and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages customer balances, khata charges, reversals and repayments.
- `lib/orders.js` adds, finds, lists and cancels orders in memory.
- `lib/pricing.js` calculates order subtotals, allocates discounts and totals line taxes.
- `lib/reports.js` builds dashboard totals and compares saved order figures with invoice figures.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits tax into CGST and SGST.

## Commands

- Start the app from the repo root with `npm start` (runs `node server.js`).
- Run tests from the repo root with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules covered by the ticket.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Checkout cannot sell the last sellable unit. `check()` rejects `qty >= sellable`, where sellable is `max(0, stock - reserved)`.
- Cancelling an order never restores physical stock. Checkout saves the product ID as `line.id` and deducts from `product.stock`. Cancellation calls `release()`, which looks up `line.productId` and reduces `product.reserved` if it finds a match.
- Allowed files are `lib/inventory.js` and `lib/orders.js`. In `lib/orders.js`, only `cancel()` is in scope.
