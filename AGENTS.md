# Repository Guidelines

## Stack

ShopLedger uses Node.js with CommonJS, Express and body-parser. `server.js` serves the HTML, CSS and plain JavaScript in `public/` and mounts the API routers under `/api`. `config.js` defines shop settings, GST slabs and coupons. Application data lives in `data/db.json`.

## Module map

- `routes/customers.js` lists customer accounts and records Khata settlements.
- `routes/orders.js` lists, fetches, places and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing preview and admin export.
- `lib/coupons.js` normalizes codes, validates eligibility and calculates discounts.
- `lib/dates.js` formats dates, normalizes filter values and derives the fiscal year.
- `lib/inventory.js` checks sellable stock, updates inventory and summarizes stock levels.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` creates, retrieves, filters and cancels order records.
- `lib/pricing.js` allocates coupon discounts across lines and computes checkout GST and totals.
- `lib/reports.js` summarizes sales and compares invoice figures with stored order figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits tax into CGST and SGST.

## Commands

- `npm start` runs `node server.js` to start the app.
- `node --test` runs Node’s built-in test runner. The repository currently has no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules covered by the ticket.
3. Use in-memory data for tests. Never read or write `data/db.json` in a test.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout taxes each line after its share of the discount. The invoice computes GST on the full line amount and defaults to 18% when the saved line lacks a GST rate.

Limit changes to `lib/invoice.js`. Change `lib/tax.js` only if the fix requires it.
