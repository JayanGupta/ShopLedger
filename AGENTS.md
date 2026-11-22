# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and body-parser for JSON requests. Express serves plain HTML, CSS, and JavaScript from public/. The app stores its data in data/db.json.

## Module map

- `routes/customers.js` lists customers and recent settlements and records Khata payments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists catalog products with stock and GST details and serves active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and a key-protected JSON export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` finds products, calculates sellable stock, checks and deducts quantities, releases holds, and summarizes inventory.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` finds and lists customers and handles Khata charges, reversals, and settlements.
- `lib/orders.js` adds, fetches, lists, and cancels orders.
- `lib/pricing.js` computes order totals with coupon discounts and line-level GST.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with saved order totals.
- `lib/store.js` reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js`.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Cannot sell the last sellable unit. `check()` rejects a line when `qty >= sellable`.
- Cancelling an order never restores stock. `cancel()` calls `release()`, which looks up `productId` while saved lines use `id`. `release()` only changes `reserved` when it finds a product.
- Allowed files are `lib/inventory.js` and `lib/orders.js` (`cancel()` only).
