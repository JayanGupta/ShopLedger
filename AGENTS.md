# ShopLedger

## Stack
- Node.js, CommonJS JavaScript, Express and body-parser.
- Browser UI uses HTML, CSS and JavaScript in `public/`.
- `server.js` serves static assets, mounts routers under `/api`, and serves HTML invoices.
- `config.js` holds shop details, GST mappings, coupons and application settings.
- Persistence is synchronous JSON file I/O through `lib/store.js` to `data/db.json`.

## Module map
- `routes/customers.js`: lists customer balances and settlements; records Khata repayments.
- `routes/orders.js`: lists, retrieves, creates and cancels orders.
- `routes/products.js`: lists products with stock/GST details and active coupons.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview and keyed database export.
- `lib/coupons.js`: normalizes, validates, calculates and lists configured coupons.
- `lib/dates.js`: local date formatting, date-key normalization and fiscal-year labels.
- `lib/inventory.js`: product lookup, sellable stock checks, stock deductions/releases and summaries.
- `lib/invoice.js`: independently calculates invoice figures and renders printable HTML.
- `lib/ledger.js`: customer balances, credit-limit checks, Khata charges/reversals and settlements.
- `lib/orders.js`: creates, retrieves, filters and cancels in-memory order records.
- `lib/pricing.js`: checkout subtotal, coupon allocation, per-line GST and totals.
- `lib/reports.js`: dashboard aggregates and comparison of saved orders with invoice figures.
- `lib/store.js`: reads/writes the JSON database, supplies missing structure and appends audit entries.
- `lib/tax.js`: resolves explicit/HSN/default GST rates, rounds amounts and splits CGST/SGST.

## Commands
- Start the app: `node server.js` (also the command behind `npm start`).
- Run tests with Node's built-in runner: `node --test`.
- No test files were found outside dependencies; `npm test` is a failing placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Checkout uses `lib/pricing.js`; printable invoices independently recalculate in `lib/invoice.js`.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
