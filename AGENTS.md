# ShopLedger

## Stack

Node.js (CommonJS), Express 4, and body-parser serve a plain HTML, CSS, and JavaScript UI from `public/`. The app persists sales, stock, and Khata accounts in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements and records repayments.
- `routes/orders.js` handles order placement, lookup, listing, and cancellation.
- `routes/products.js` serves the searchable product catalog and lists active coupons.
- `routes/reports.js` serves dashboard and GST reports, cart pricing previews, and the admin data export.
- `lib/coupons.js` normalizes codes, checks eligibility, and calculates checkout discounts.
- `lib/dates.js` formats local dates, normalizes date-filter inputs, and derives fiscal-year labels.
- `lib/inventory.js` checks sellable quantities, adjusts stock and reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures from saved order items and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, checks credit limits, charges or reverses sales, and records repayments.
- `lib/orders.js` assigns order IDs and dates, stores orders in memory, and handles lookup, filtering, and cancellation.
- `lib/pricing.js` allocates checkout discounts across items and totals GST on the discounted lines.
- `lib/reports.js` summarizes sales, stock, and receivables and compares saved order figures with invoice figures.
- `lib/store.js` reads and writes the JSON database and maintains its audit log.
- `lib/tax.js` resolves GST rates from item overrides, HSN slabs, or the fallback rate and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js`).
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket covers.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout saves the figures from `lib/pricing.js`, and `lib/invoice.js` calculates them again for printing.

Limit the fix to `lib/invoice.js`. Change `lib/tax.js` only if truly needed.
