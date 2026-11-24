# ShopLedger

## Stack

Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests. The browser UI uses plain HTML, CSS, and JavaScript in `public/`. The app persists its data in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements, and records settlements.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists and filters products, and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reports, cart pricing previews, and admin export.
- `lib/coupons.js` — Normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` — Formats local dates, normalizes date inputs, and calculates fiscal years.
- `lib/inventory.js` — Finds products, calculates sellable stock, checks and deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` — Calculates invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — Looks up Khata customers, applies and reverses order charges, and records settlements.
- `lib/orders.js` — Creates, fetches, lists, and cancels order records.
- `lib/pricing.js` — Calculates subtotal, coupon discount, per-line GST, and order totals.
- `lib/reports.js` — Calculates dashboard figures and compares saved order totals with invoice figures.
- `lib/store.js` — Reads and writes the JSON database and records audit entries.
- `lib/tax.js` — Resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start`, which runs `node server.js`. The port defaults to 3000 and can be set with `PORT`.
- Run tests with `node --test`. The repository currently has no test files, and `npm test` is a placeholder that exits with status 1.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module or modules the ticket covers.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Checkout cannot sell the last sellable unit. `inventory.check()` rejects `qty >= sellable`.
- Cancelling an order never restores physical stock. `orders.cancel()` calls `inventory.release()`, which looks for `productId` while saved lines use `id`. When a product matches, `release()` reduces `reserved` without increasing `stock`.
- Allowed files are `lib/inventory.js` and `lib/orders.js` (only `cancel()`).
