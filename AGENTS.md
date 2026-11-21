# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and `body-parser` for JSON requests. Express serves plain HTML, CSS, and browser JavaScript from `public/`. The app persists its state in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements, and records settlement payments.
- `routes/orders.js` — Lists, fetches, places, and cancels orders. Placement checks stock, calculates checkout totals, and charges Khata when selected.
- `routes/products.js` — Lists and filters products, shows stock and GST rates, and lists active coupons.
- `routes/reports.js` — Serves the dashboard, GST reconciliation, cart pricing preview, and admin export.
- `lib/coupons.js` — Normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` — Formats local dates, converts date strings to `DD/MM/YYYY`, and derives fiscal years.
- `lib/inventory.js` — Finds products, calculates sellable stock, checks availability, and updates stock or reservations.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML with a total mismatch notice.
- `lib/ledger.js` — Finds customers, calculates balances, applies or reverses Khata charges, and records settlements.
- `lib/orders.js` — Builds and stores order records in memory, fetches and filters them, and handles cancellations.
- `lib/pricing.js` — Calculates checkout totals, allocates coupon discounts to lines, and applies GST to discounted line amounts.
- `lib/reports.js` — Builds dashboard summaries and compares saved order totals and GST with invoice calculations.
- `lib/store.js` — Reads and rewrites the JSON database and appends audit entries.
- `lib/tax.js` — Resolves item GST rates from overrides, configured HSN keys, or the default rate, and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`. It uses `PORT` or defaults to `3000`.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed at checkout.

Allowed files for the fix: `lib/invoice.js`, and `lib/tax.js` only if truly needed.
