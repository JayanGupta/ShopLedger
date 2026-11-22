# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser 1.
- Browser UI is static HTML, JavaScript, and CSS in `public/`.
- Application records are read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — list customer/settlement data and record Khata settlements.
- `routes/orders.js` — list, fetch, create, and cancel orders.
- `routes/products.js` — list products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalize, retrieve, validate, calculate, and list coupons.
- `lib/dates.js` — current date, date-key normalization, and fiscal year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation/release, and summary.
- `lib/invoice.js` — compute printable invoice figures and render invoice HTML.
- `lib/ledger.js` — customer balances, Khata order charges/reversals, and settlements.
- `lib/orders.js` — add, get, cancel, and filter/sort orders.
- `lib/pricing.js` — subtotal, discount delegation, line tax, and order totals.
- `lib/reports.js` — dashboard summary and stored-order versus invoice reconciliation.
- `lib/store.js` — read/write `data/db.json` and append bounded audit entries.
- `lib/tax.js` — resolve GST rates and split tax into CGST and SGST.

## Commands
- Start the app: `node server.js` (equivalent package script: `npm start`).
- Run tests: `node --test`.
- `package.json`'s `test` script is a placeholder that exits with an error; use `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
