# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Synchronous JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements, and records repayments.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Serves the product catalog and active coupons.
- `routes/reports.js` — Serves dashboard summaries, GST reconciliation, cart pricing previews, and admin export.
- `lib/coupons.js` — Normalizes coupon codes, validates them, and calculates discounts.
- `lib/dates.js` — Formats dates and derives fiscal-year labels.
- `lib/inventory.js` — Looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` — Recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` — Tracks Khata balances, charges, reversals, and settlements.
- `lib/orders.js` — Creates, retrieves, filters, sorts, and cancels order records.
- `lib/pricing.js` — Calculates checkout subtotal, coupon discount, line GST, and total.
- `lib/reports.js` — Builds dashboard summaries and compares invoice figures with saved order figures.
- `lib/store.js` — Reads and writes the JSON store and maintains the audit log.
- `lib/tax.js` — Resolves item GST rates and splits tax into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`.
- Run tests with `node --test`. There are currently no test files, and the package test script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout uses HSN rates on discounted line values. The invoice recomputes GST on full line values and falls back to the default rate when the order line has no `gstRate`.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
