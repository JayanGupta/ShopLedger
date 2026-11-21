# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser 1 for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Synchronous JSON storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records payments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` normalizes coupon codes, validates eligibility, and computes discounts.
- `lib/dates.js` formats dates, normalizes date filters, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` calculates printable invoice figures and renders invoice HTML.
- `lib/ledger.js` manages Khata balances, credit charges, reversals, and settlements.
- `lib/orders.js` creates, finds, filters, and cancels orders.
- `lib/pricing.js` calculates checkout subtotals, discounts, line GST, and totals.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with stored order totals and tax.
- `lib/store.js` reads and rewrites the JSON datastore and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js` (`npm start` runs the same command).
- Run tests with `node --test`. The `npm test` script is still a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Tests must use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
