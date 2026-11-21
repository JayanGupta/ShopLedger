# ShopLedger

## Stack

Node.js with CommonJS, Express 4 and body-parser 1, a browser UI in plain HTML, CSS and JavaScript, and a JSON file store at `data/db.json`. The app handles POS orders, Khata credit and settlements, and printable GST invoices.

## Module map

- `routes/customers.js` lists customers and recent settlements and records settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and database export.
- `lib/coupons.js` normalizes coupon codes, validates them, and calculates discounts.
- `lib/dates.js` formats today's date, normalizes date filter keys, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` creates, retrieves, cancels, filters, and sorts orders.
- `lib/pricing.js` computes checkout subtotals, discounts, GST, and totals.
- `lib/reports.js` builds dashboard summaries and compares stored order totals with invoice figures.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js`. The `npm start` script runs the same command.
- Run tests with `node --test`. The current `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules covered by the ticket.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Order History should be newest first. Order #1004 (30/01/2022) and #1001 (28/12/2021) appear above #1008 (15/03/2022). Date-range filters also return wrong results. `orders.list()` compares day-first date strings.
- In Customer Khata, Meera Joshi owes ₹1,232.01 and has settled ₹1,200. Recording a ₹500 settlement turns Total Settled into `1200500` and Balance Due into -₹1,198,067.99. The browser sends the amount as a string, and the ledger concatenates it with the existing total.
- Allowed files are `lib/orders.js` (`list()` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`, and files directly related to the fix.
