# ShopLedger

## Stack

Node.js with CommonJS, Express 4 and body-parser. `server.js` serves the HTML, CSS and JavaScript in `public/` and mounts the API routers under `/api`. The app stores its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records payments.
- `routes/orders.js` handles order placement, lookup, listing and cancellation.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves dashboard and GST reports, pricing previews and the admin export.
- `lib/coupons.js` validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable quantities, handles stock movements and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` calculates customer balances, charges and reverses Khata debits, and records settlements.
- `lib/orders.js` adds, retrieves, filters and cancels order records.
- `lib/pricing.js` allocates discounts across order lines and calculates tax and order totals.
- `lib/reports.js` builds dashboard summaries and compares saved order totals with invoice figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js`).
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket covers.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- The last sellable unit cannot be sold. `inventory.check()` rejects a line when `qty >= sellable`, where sellable is `max(0, stock - reserved)`.
- Cancelling an order never restores physical stock. Checkout saves `item.id` and deducts `qty` from `product.stock`. `orders.cancel()` calls `inventory.release()`, which looks up `item.productId` and only reduces `product.reserved` on a match.
- Allowed files are `lib/inventory.js` and `lib/orders.js`. In `lib/orders.js`, only `cancel()` is in scope.
