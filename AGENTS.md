# Repository Guidelines

## Stack

ShopLedger uses Node.js, CommonJS, Express 4, and body-parser. Express serves the HTML, CSS, and browser JavaScript in `public/`. The application stores its records in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements and records customer payments.
- `routes/orders.js` handles requests to place, list, retrieve, and cancel orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves dashboard and GST reports, cart pricing previews, and the admin export.
- `lib/coupons.js` validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes them for comparison, and determines the fiscal year.
- `lib/inventory.js` checks sellable stock, deducts or restores quantities, and summarizes inventory.
- `lib/invoice.js` uses checkout pricing to calculate invoice figures and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, charges, cancellations, and settlements.
- `lib/orders.js` creates, retrieves, filters, sorts, and cancels order records.
- `lib/pricing.js` allocates coupon discounts across items and calculates line GST and order totals.
- `lib/reports.js` summarizes the dashboard and compares invoice figures with the order ledger.
- `lib/store.js` reads and writes the JSON data file and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- `npm start` starts the Express app from the repository root.
- `node --test` runs the test suite from the repository root.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules covered by the ticket.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Reported issue: Invoice total and GST breakdown do not match what the customer was billed.
Limit the fix to `lib/invoice.js`. Change `lib/tax.js` only if the fix requires it.
