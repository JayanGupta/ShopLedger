# ShopLedger

## Stack

Node.js and Express serve the POS, Khata credit ledger, and GST invoices. `server.js` uses `body-parser` for JSON requests and serves HTML, CSS, and browser JavaScript from `public/`. The app persists data in `data/db.json`. Tests use `node:test` and `node:assert/strict`.

## Module map

- `routes/customers.js` lists Khata accounts and settlements and records customer payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` serves the product catalog with sellable stock and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and admin export.
- `lib/coupons.js` validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and computes fiscal years.
- `lib/inventory.js` checks sellable stock, deducts physical stock, handles release, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders.
- `lib/pricing.js` calculates checkout totals and apportions cart discounts before computing GST.
- `lib/reports.js` summarizes sales and compares stored order totals with invoice figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js`).
- Run the tests with `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.

`inventory.check()` rejects a line when `qty >= sellable`. Checkout stores the product ID as `id` and subtracts `qty` from physical `stock`. On cancellation, `inventory.release()` looks up `productId`, skips those saved lines, and only reduces `reserved` on a match.

Allowed files for this ticket are `lib/inventory.js` and `lib/orders.js` (the `cancel` function only).
