# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Plain HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Synchronous JSON persistence in `data/db.json`. Configuration lives in `config.js`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` — Lists and retrieves orders, places orders, and handles cancellation.
- `routes/products.js` — Lists and filters products and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` — Normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` — Formats local dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` — Calculates sellable stock, checks availability, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — Looks up Khata accounts, charges and reverses order debits, and records settlements.
- `lib/orders.js` — Creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Computes checkout subtotals, coupon allocations, line GST, and payable totals.
- `lib/reports.js` — Builds dashboard summaries and compares saved order figures with recalculated invoice figures.
- `lib/store.js` — Reads and writes the JSON store and retains the latest 100 audit entries.
- `lib/tax.js` — Resolves GST rates from item overrides or configured HSN slabs and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The port is `PORT` or 3000 by default.
- Run tests with `node --test` from the repo root. The repo currently has no test files, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printed invoice total and GST breakdown can differ from the amounts charged at checkout. Checkout saves the billed figures, while the invoice recalculates them using its own GST and coupon rules.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
