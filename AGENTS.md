# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser.
- Static HTML, CSS, and browser JavaScript in `public/`.
- File-backed storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and settlements and records payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats local dates, normalizes date keys, and calculates fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, deducts and restores physical stock, and summarizes inventory.
- `lib/invoice.js` computes invoice figures with shared pricing and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, order debits and reversals, and settlements.
- `lib/orders.js` adds, retrieves, cancels, filters, and sorts orders.
- `lib/pricing.js` calculates cart discounts, line taxes, and totals.
- `lib/reports.js` builds dashboard metrics and reconciles invoice figures against recorded order totals.
- `lib/store.js` reads and writes the JSON data file and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The repository currently has no test files, and the npm test script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Reported symptoms: The last sellable unit could not be sold, and cancelling an order did not restore stock.
- Current code accepts a quantity equal to sellable stock and restores physical stock on cancellation.
- Allowed files: `lib/inventory.js` and `lib/orders.js` (the `cancel()` function only).
