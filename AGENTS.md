# ShopLedger

## Stack

Node.js with CommonJS, Express, and body-parser. Express serves the plain HTML, CSS, and JavaScript in `public/`. The app persists its state in `data/db.json`.

## Module map

- `routes/customers.js` lists customers and records Khata settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` normalizes codes, validates coupons, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, updates inventory, and summarizes stock.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit limits, order debits, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals, allocates coupon discounts, and computes line GST.
- `lib/reports.js` builds dashboard summaries and compares saved order amounts with invoice figures.
- `lib/store.js` reads and writes the JSON database and maintains its audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`.
- Run tests with `node --test`. The repository currently has no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice recalculates the total and GST breakdown using different rules from checkout, so the figures can differ from what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
