# ShopLedger project guidance

## Stack
- Node.js and Express 4 with CommonJS modules. The server parses JSON requests with `body-parser`.
- `server.js` serves the plain HTML, CSS, and JavaScript in `public/`, mounts the routers at `/api`, and serves printable GST invoices.
- `config.js` defines the port and shop settings. `lib/store.js` persists app data in `data/db.json`.

## Module map
- `routes/customers.js` — Lists Khata customers and settlements and records repayments.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists and filters products and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` — Normalizes codes, validates eligibility, and calculates discounts.
- `lib/dates.js` — Formats today's date, normalizes date keys, and determines fiscal years.
- `lib/inventory.js` — Finds products, computes sellable stock, checks quantities, deducts stock, releases holds, and summarizes inventory.
- `lib/invoice.js` — Calculates invoice figures and renders printable HTML.
- `lib/ledger.js` — Looks up Khata customers, applies and reverses order charges, and records settlements.
- `lib/orders.js` — Adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Calculates order totals with proportional coupon discounts and per-line GST.
- `lib/reports.js` — Builds dashboard summaries and compares recorded order totals with invoice figures.
- `lib/store.js` — Reads and writes the JSON database and appends audit entries.
- `lib/tax.js` — Resolves GST rates and splits GST into CGST and SGST.

## Commands
- Start the app with `node server.js` or `npm start`. The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The app has no test files today, and the package's `npm test` script is a placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Cannot sell the last sellable unit in stock. `inventory.check()` rejects quantities equal to sellable stock.
- Cancelling an order never restores stock. `orders.cancel()` calls `inventory.release()`, which looks for `productId` on lines that use `id` and reduces `reserved` on a match. Order placement deducts from `stock`.
- Allowed files are `lib/inventory.js` and `lib/orders.js` (`cancel()` only).
