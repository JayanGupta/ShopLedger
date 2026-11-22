# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` mounts the API under `/api`, serves plain HTML, CSS, and JavaScript from `public/`, and renders printable GST invoices.
- `lib/store.js` reads and rewrites `data/db.json` synchronously.

## Module map

- `routes/customers.js` — Lists customers and recent settlements and records Khata payments.
- `routes/orders.js` — Lists, fetches, creates, and cancels orders.
- `routes/products.js` — Lists products with stock and GST details and exposes active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation data, previews cart pricing, and exports the database.
- `lib/coupons.js` — Normalizes codes, validates coupons, computes discounts, and lists active offers.
- `lib/dates.js` — Formats today's date as `DD/MM/YYYY`, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` — Finds products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — Calculates invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — Looks up customers, calculates Khata balances, charges or reverses orders, and records settlements.
- `lib/orders.js` — Adds, fetches, cancels, filters, and sorts orders.
- `lib/pricing.js` — Calculates subtotals, coupon discounts, per-line GST, and order totals.
- `lib/reports.js` — Builds dashboard totals and compares stored order figures with invoice calculations.
- `lib/store.js` — Loads and saves the JSON database, initializes missing top-level fields, and appends audit entries.
- `lib/tax.js` — Resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js`). The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The repository currently has no test files, and `npm test` is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Order history sorting and date filters compare day-first strings, so the results can be wrong across months or years.
- Khata settlement amounts arrive as strings from the browser. Adding the raw value to `totalSettled` can concatenate it and corrupt the customer's balance.
- Allowed files: `lib/orders.js` (`list()` only), `lib/dates.js`, `lib/ledger.js`, and `routes/customers.js`.
