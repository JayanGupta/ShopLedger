# ShopLedger

## Stack

- Node.js with CommonJS, Express `^4.17.1`, and `body-parser ^1.19.0`.
- Express serves plain HTML, CSS, and browser JavaScript from `public/`.
- `lib/store.js` persists application state in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and the admin export.
- `lib/coupons.js` normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats local dates, normalizes date strings, and calculates fiscal-year labels.
- `lib/inventory.js` finds products, checks sellable stock, and handles stock deductions and reservation releases.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit charges, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals and prorates coupon discounts before line GST.
- `lib/reports.js` builds dashboard totals and compares saved order figures with invoice calculations.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (also the `npm start` script).
- Run tests with `node --test`. There are no committed tests, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data. They must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies HSN-based GST to discounted line amounts and saves aggregate figures. The invoice recalculates GST and coupon discounts separately.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
