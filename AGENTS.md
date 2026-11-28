# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript served from `public/`.
- File-backed storage in `data/db.json`. Express serves printable HTML invoices.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and determines fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` handles Khata balances, order charges and reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals and apportions coupon discounts before line GST.
- `lib/reports.js` aggregates dashboard figures and compares saved order totals and GST with invoice figures.
- `lib/store.js` reads and rewrites the JSON database and maintains its audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` or `node server.js`. The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed.
Allowed files are `lib/invoice.js` and `lib/tax.js` only if truly needed.
