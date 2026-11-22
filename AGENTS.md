# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` serves plain HTML, CSS, and browser JavaScript from `public/` and mounts the routers under `/api`.
- `lib/store.js` persists application data in `data/db.json` with synchronous file I/O.

## Module map

- `routes/customers.js` — Lists customers and recent Khata settlements and records settlements.
- `routes/orders.js` — Lists, retrieves, creates, and cancels orders.
- `routes/products.js` — Lists products and active coupons.
- `routes/reports.js` — Serves the dashboard, GST reconciliation, cart pricing preview, and admin export.
- `lib/coupons.js` — Normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` — Formats today's date, normalizes date strings, and calculates fiscal-year labels.
- `lib/inventory.js` — Looks up products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — Calculates invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — Looks up customers, computes balances, applies or reverses Khata charges, and records settlements.
- `lib/orders.js` — Adds, retrieves, cancels, and lists orders.
- `lib/pricing.js` — Computes subtotals, allocates coupon discounts across lines, and calculates GST and order totals.
- `lib/reports.js` — Summarizes dashboard metrics and compares stored order amounts with invoice figures.
- `lib/store.js` — Reads and writes the JSON data file and appends audit entries.
- `lib/tax.js` — Resolves item GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start` (`node server.js`). The default port is 3000, configurable through `PORT`.
- Run tests from the repo root with `node --test`. It currently discovers zero tests.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules named in the ticket.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Order history sorting and date filtering are broken. The list compares day-first date strings lexicographically.
- Khata settlements can corrupt customer balances. The settlement route passes the amount through as supplied, and the ledger can concatenate a string amount into `totalSettled`.
- Allowed files are `lib/orders.js` (`list()` only), `lib/dates.js`, `lib/ledger.js`, and `routes/customers.js`.
