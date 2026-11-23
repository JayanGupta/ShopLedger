# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Browser UI in `public/` uses HTML, CSS, and plain JavaScript served by Express.
- `lib/store.js` reads and writes the app's JSON store at `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements and records settlement payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date inputs, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit charges, reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records in memory.
- `lib/pricing.js` computes checkout totals, allocating discounts across lines before GST.
- `lib/reports.js` computes dashboard metrics and compares saved order figures with recalculated invoice figures.
- `lib/store.js` loads and rewrites the JSON store and keeps the most recent 100 audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start`. It runs `node server.js` and defaults to port 3000.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed. Checkout saves its tax and total on the order. The printable invoice recalculates them from the saved items and current configuration.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
