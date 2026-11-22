# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` 1 for JSON requests.
- `server.js` serves the plain HTML, CSS, and JavaScript in `public/`, mounts the API at `/api`, and serves printable invoices at `GET /orders/:id/invoice`.
- `config.js` holds shop, GST, and coupon settings. `lib/store.js` persists app data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements and records settlement payments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, checkout pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates codes and calculates discounts.
- `lib/dates.js` provides date formatting, normalization, and fiscal-year helpers.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` tracks Khata charges, debit reversals, balances, and settlements.
- `lib/orders.js` creates, looks up, filters, sorts, and cancels order records.
- `lib/pricing.js` apportions coupon discounts across lines and computes checkout GST and totals.
- `lib/reports.js` summarizes sales and inventory and compares invoice figures with saved orders.
- `lib/store.js` reads and rewrites the JSON database and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits total GST into CGST and SGST.

## Commands

- `node server.js` starts the app on port `3000` by default. Set `PORT` to override it.
- `node --test` runs tests with Node's built-in test runner. The repo has no test files today.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout applies HSN-based GST after allocating coupon discounts across lines. The invoice recalculates GST on gross lines with an 18% fallback and applies percentage coupons to the subtotal plus GST.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
