# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests.
- Express serves plain HTML, CSS, and JavaScript from `public/` and mounts the routers under `/api`.
- The app stores its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements and records repayments.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and admin export.
- `lib/coupons.js` normalizes codes, checks eligibility, calculates discounts, and lists active coupons.
- `lib/dates.js` supplies order dates, normalizes date strings, and calculates fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up Khata customers and handles balances, charges, reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels orders in the database object.
- `lib/pricing.js` computes checkout subtotals, coupon discounts, per-line GST, and totals.
- `lib/reports.js` builds dashboard summaries and compares stored order totals and GST with invoice figures.
- `lib/store.js` loads and saves the database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`. The port defaults to 3000 and can be set with `PORT`.
- Run tests from the repo root with `node --test`. The package's `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout saves tax and total from `lib/pricing.js`. The invoice recalculates those figures from saved line items and current configuration.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
