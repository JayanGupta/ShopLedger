# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and `body-parser` for JSON requests. The browser UI uses HTML, CSS, and JavaScript served from `public/`. The app persists data in `data/db.json` using synchronous file I/O.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` normalizes codes, validates coupons, and calculates discounts.
- `lib/dates.js` formats dates, normalizes filter inputs, and calculates fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit-limit checks, order debit reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` apportions coupon discounts and calculates checkout line taxes and totals.
- `lib/reports.js` summarizes the dashboard and compares invoice figures with saved order figures.
- `lib/store.js` reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`. The default port is 3000 and `PORT` overrides it.
- Run tests with Node's built-in runner using `node --test`. The repo currently has no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout saves its calculated totals, while the invoice recalculates GST and discounts independently.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
