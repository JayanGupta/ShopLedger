# ShopLedger

## Stack

- Node.js with CommonJS modules, Express, and `body-parser` for JSON requests.
- `server.js` serves plain HTML, CSS, and browser JavaScript from `public/`.
- `config.js` holds shop, tax, coupon, and inventory settings. The app persists its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard data, GST reconciliation, pricing previews, and admin export.
- `lib/coupons.js` normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats and normalizes dates and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice totals and renders printable HTML.
- `lib/ledger.js` calculates customer balances and records or reverses Khata charges and records settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` allocates coupon discounts and calculates checkout totals and line GST.
- `lib/reports.js` calculates dashboard summaries and compares invoice figures with stored order figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies HSN-based GST to discounted line values. The invoice recomputes GST on full line values and uses the default rate when the saved line has no `gstRate`.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
