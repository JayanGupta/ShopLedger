# ShopLedger

## Stack

ShopLedger uses Node.js with CommonJS modules, Express 4 and body-parser. `server.js` serves the HTML, CSS and browser JavaScript in `public/` and mounts the API routers under `/api`. Shop settings live in `config.js`. Application data lives in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements, and records customer payments.
- `routes/orders.js` lists, retrieves, creates and cancels orders.
- `routes/products.js` lists and filters products, and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview and admin data export.
- `lib/coupons.js` normalizes and validates coupon codes, calculates discounts and lists active offers.
- `lib/dates.js` formats dates, normalizes date filter values and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts quantities and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, checks credit limits, charges or reverses order debits and records settlements.
- `lib/orders.js` assigns order IDs, adds and retrieves orders, filters the register and handles cancellation.
- `lib/pricing.js` calculates checkout totals by allocating the coupon across lines and applying GST to discounted amounts.
- `lib/reports.js` summarizes sales, inventory and receivables, and compares stored order figures with invoice figures.
- `lib/store.js` reads and writes the JSON data file and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start`. It runs `node server.js` and uses `PORT` or defaults to 3000.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout applies the coupon before calculating GST at each item's HSN rate. The invoice calculates GST on gross lines using a saved rate or the default, then applies the coupon.

Limit changes to `lib/invoice.js`. Change `lib/tax.js` only if the fix truly requires it.
