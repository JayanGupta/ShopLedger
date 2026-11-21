# ShopLedger

## Stack
- Node.js with CommonJS, Express 4, and body-parser.
- Plain HTML, CSS, and JavaScript in `public/`. `lib/store.js` persists data in `data/db.json`.

## Module map
- `routes/products.js` serves product stock, GST rates, and available coupons.
- `routes/orders.js` lists orders, looks up orders, and handles checkout and cancellation.
- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/reports.js` serves dashboard and GST reports, pricing previews, and exports.
- `lib/coupons.js` normalizes and validates coupons and computes capped discounts.
- `lib/dates.js` formats dates and provides filter keys and fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, and handles stock adjustments.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, charges, reversals, and settlements.
- `lib/orders.js` creates, finds, lists, and cancels orders.
- `lib/pricing.js` computes checkout subtotals, discounts, line GST, and totals.
- `lib/reports.js` builds dashboard summaries and reconciles invoice figures with saved orders.
- `lib/store.js` reads and writes the JSON database and maintains its audit log.
- `lib/tax.js` resolves HSN rates and splits GST into CGST and SGST.

## Commands
- Start from the repo root with `npm start`. The default URL is `http://localhost:3000/`.
- Run the in-memory suite with `node --test`. `npm test` is a placeholder that exits 1.

## Rules
1. Write and run characterization tests before changing behavior.
2. Limit production edits to the current ticket’s allowed modules.
3. Use in-memory fixtures. Tests must never read or write `data/db.json`.
4. Use the built-in Node test runner and add no dependencies.
5. Make the smallest fix that covers the ticket and rerun the tests.

## Workshop tickets
- GitHub #1. Match printed invoice totals and GST to checkout. Production scope is `lib/invoice.js`.
- GitHub #2. Sell the exact available stock and restore it on cancellation. Production scope is `lib/inventory.js` and `lib/orders.js`.
- GitHub #3. Sort and filter order dates chronologically and add Khata settlements numerically. Production scope is `lib/dates.js`, `lib/orders.js`, and `lib/ledger.js`.
