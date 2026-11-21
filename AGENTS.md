# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Plain HTML, CSS, and JavaScript in `public/`, served by `server.js`.
- Synchronous JSON file storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements, and records settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists and filters products and exposes active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` normalizes codes, validates coupons, and calculates discounts.
- `lib/dates.js` formats local dates as DD/MM/YYYY, normalizes date input, and computes fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, deducts stock, adjusts reservations, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up customers, computes balances, charges and reverses Khata orders, and records settlements.
- `lib/orders.js` adds, retrieves, cancels, filters, and sorts orders.
- `lib/pricing.js` calculates subtotals, discounts, line taxes, and order totals.
- `lib/reports.js` summarizes sales, inventory, and Khata receivables, and compares invoice figures with saved order totals.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start from the repository root with `node server.js`. The port defaults to 3000 and can be set with `PORT`.
- Run tests with `node --test`. The package's `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Order history sorting and date filtering compare DD/MM/YYYY strings, which puts the day ahead of the month and year.
- Khata settlements can corrupt customer balances when a string amount is concatenated into `totalSettled`.
- Allowed files are `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, and `routes/customers.js`.
