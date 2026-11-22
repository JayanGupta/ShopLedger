# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Synchronous JSON storage in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements and records payments.
- `routes/orders.js` — Lists, retrieves, creates, and cancels orders.
- `routes/products.js` — Lists catalog products and active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` — Normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` — Formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — Finds products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — Manages Khata balances, order debits and reversals, and settlements.
- `lib/orders.js` — Creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Calculates checkout subtotal, coupon allocation, line GST, and total.
- `lib/reports.js` — Aggregates dashboard figures and compares saved order figures with invoice calculations.
- `lib/store.js` — Reads and rewrites the JSON store and appends audit entries.
- `lib/tax.js` — Resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket covers.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout saves the figures from `pricing.computeTotals()`. The invoice recalculates them independently.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
