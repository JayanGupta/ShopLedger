# ShopLedger

## Stack

- Node.js and CommonJS with Express 4 and body-parser 1 for JSON requests.
- Plain HTML, CSS, and browser JavaScript served from `public/`.
- Synchronous JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date filter keys, and derives fiscal years.
- `lib/inventory.js` checks sellable stock, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, charges, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders.
- `lib/pricing.js` allocates checkout discounts and calculates line GST and order totals.
- `lib/reports.js` summarizes sales, inventory, and Khata and compares recorded and invoice figures.
- `lib/store.js` reads and writes the JSON store and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `node server.js` (or `npm start`). The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. The repository has no tests yet, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout calculates GST from HSN on discounted lines. The invoice recalculates GST on full-price lines and defaults to 18% when the saved line has no GST rate.

Allowed files: `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
