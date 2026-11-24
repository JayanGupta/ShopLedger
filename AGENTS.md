# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser 1 for JSON requests.
- Plain HTML, CSS, and browser JavaScript in `public/`.
- The app persists its data in `data/db.json` using Node's filesystem API.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reports, pricing previews, and an admin export.
- `lib/coupons.js` normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats today's date, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, deducts physical stock, handles release attempts, and summarizes inventory.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata customer balances, order debits, reversals, and settlements.
- `lib/orders.js` creates, retrieves, lists, and cancels orders in memory.
- `lib/pricing.js` calculates checkout subtotals, discounts, GST, and totals.
- `lib/reports.js` builds dashboard summaries and compares recorded order figures with invoice figures.
- `lib/store.js` reads and writes the JSON data file and appends audit entries in memory.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app from the repo root with `npm start`, which runs `node server.js`.
- Run tests from the repo root with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the production modules the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Checkout rejects the last sellable unit because `inventory.check()` rejects quantities equal to sellable stock.
- Cancelling an order never restores physical stock. `inventory.release()` looks for `productId` on lines saved with `id` and only adjusts `reserved` on a match.
- Allowed production files are `lib/inventory.js` and `lib/orders.js` (`cancel()` only).
