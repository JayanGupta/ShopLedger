# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and `body-parser` for JSON requests. `server.js` serves plain HTML, CSS, and JavaScript from `public/` and renders printable invoices through `lib/invoice.js`. The app persists data in `data/db.json`.

## Module map

- `routes/customers.js` — lists Khata customers and recent settlements, and records settlements.
- `routes/orders.js` — lists, retrieves, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` — normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` — formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — looks up products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` — recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — tracks Khata balances, order debits and reversals, and settlements.
- `lib/orders.js` — creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — calculates checkout subtotals, apportions coupon discounts, and computes line GST and order totals.
- `lib/reports.js` — aggregates dashboard metrics and compares stored tax and totals with recalculated invoice figures.
- `lib/store.js` — reads and writes `data/db.json` and maintains the audit log.
- `lib/tax.js` — resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`. The default port is `3000`, and `PORT` overrides it.
- Run tests from the repo root with `node --test`. The repository currently has no test files, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout applies HSN-based GST to discounted line amounts. The invoice recalculates GST on full line amounts, skips the HSN lookup, and applies its own coupon calculation.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
