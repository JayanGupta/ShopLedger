# ShopLedger

## Stack

- Node.js, CommonJS, Express, and body-parser; entry point: `server.js`.
- Browser UI: plain HTML, CSS, and JavaScript in `public/`.
- Persistence: synchronous reads and whole-file writes of `data/db.json` via `lib/store.js`.
- `config.js` defines shop details, GST slabs, coupons, inventory defaults, port, and admin key.

## Module map

- `routes/customers.js`: Lists customer accounts and settlements; records Khata repayments.
- `routes/orders.js`: Lists, retrieves, creates, and cancels orders; coordinates pricing, stock, and Khata.
- `routes/products.js`: Lists products with sellable stock/GST details and active coupons.
- `routes/reports.js`: Dashboard, GST reconciliation, cart pricing preview, and key-protected database export.
- `lib/coupons.js`: Normalizes codes, validates eligibility, calculates capped discounts, and lists active coupons.
- `lib/dates.js`: Creates DD/MM/YYYY dates, converts date inputs, and derives fiscal-year labels.
- `lib/inventory.js`: Finds products, checks sellable stock, deducts stock, handles release, and summarizes inventory.
- `lib/invoice.js`: Independently recalculates invoice figures and renders printable HTML with a total-mismatch warning.
- `lib/ledger.js`: Customer lookup, credit-limit checks, Khata debits/reversals, balances, and settlements.
- `lib/orders.js`: Adds, retrieves, filters, sorts, and cancels orders in the supplied database object.
- `lib/pricing.js`: Calculates subtotals, proportional coupon allocation, post-discount line GST, and totals.
- `lib/reports.js`: Builds dashboard summaries and compares stored order figures with recalculated invoices.
- `lib/store.js`: Reads/writes the JSON database, supplies missing structure, and retains up to 100 audit entries.
- `lib/tax.js`: Resolves explicit rates or exact HSN matches, falls back to default GST, and splits CGST/SGST.

## Commands

- Start the app: `node server.js` (also the command behind `npm start`).
- Run tests: `node --test`; no test files are currently present in the repository outside dependencies.
- The current `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
- Today, invoices calculate independently from checkout and do not call `lib/pricing.js` or `lib/tax.js`.
