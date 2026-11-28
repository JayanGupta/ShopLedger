# ShopLedger

## Stack

- Node.js with CommonJS modules, Express, and body-parser for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Synchronous JSON persistence in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements, and records settlements.
- `routes/orders.js` — Lists, fetches, places, and cancels orders. Checkout checks stock, computes totals, and charges Khata when selected.
- `routes/products.js` — Lists and filters products with GST and sellable stock, and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and a key-protected JSON export.
- `lib/coupons.js` — Normalizes codes, validates coupons, calculates discounts, and lists active coupons.
- `lib/dates.js` — Formats today's date, normalizes date strings, and derives fiscal-year labels.
- `lib/inventory.js` — Looks up products, computes sellable stock, checks quantities, deducts physical stock, adjusts reservations, and summarizes inventory.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML with a notice when the total differs from the saved order.
- `lib/ledger.js` — Looks up customers, calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` — Adds, fetches, cancels, and filters orders.
- `lib/pricing.js` — Computes checkout totals with proportional coupon allocation and per-line GST on discounted amounts.
- `lib/reports.js` — Summarizes sales, stock, and receivables and compares saved order figures with recalculated invoices.
- `lib/store.js` — Reads and rewrites the JSON database and keeps the latest 100 audit entries when appending.
- `lib/tax.js` — Resolves GST rates from item overrides, exact HSN matches, or the configured default, and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`.
- Run tests from the repo root with `node --test`. There are currently no repository test files, and the `npm test` script exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout uses HSN rates on discounted lines. The invoice recalculates GST on full line prices and applies percentage coupons after GST.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
