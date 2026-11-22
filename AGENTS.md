# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` serves the plain HTML, CSS, and JavaScript in `public/`.
- `lib/store.js` persists application data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata charges, debit reversals, settlements, and balances.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals and applies GST to discounted line values.
- `lib/reports.js` summarizes the dashboard and compares stored order figures with calculated invoice figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`. The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`. The repo currently has no test files, and the `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules covered by the ticket.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown differ from what checkout billed. Checkout applies HSN rates to discounted line values and stores the billed totals. The invoice recalculates GST on undiscounted lines and applies its own coupon calculation.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
