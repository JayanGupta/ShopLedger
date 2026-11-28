# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and body-parser 1 for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Products, orders, Khata accounts, settlements, and audit entries are stored in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, checkout previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, derives date keys, and calculates fiscal-year labels.
- `lib/inventory.js` calculates sellable stock, checks availability, deducts physical stock, and releases reservation holds.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` creates, retrieves, filters, sorts, and cancels orders.
- `lib/pricing.js` allocates cart discounts across lines and calculates checkout GST and totals.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with stored order figures.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`.
- Run tests from the repo root with `node --test`. The `package.json` test script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout calculates GST on discounted lines using HSN rates. The invoice recalculates GST on full-price lines, uses a saved `gstRate` when truthy, and otherwise falls back to 18%. Checkout lines omit `gstRate`.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
