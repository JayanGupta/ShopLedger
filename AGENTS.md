# ShopLedger

## Stack

- Node.js application using Express and `body-parser`.
- Static browser UI in `public/`; JSON persistence in `data/db.json`.
- The app handles POS orders, inventory, Khata customer balances, coupons, GST figures, and printable HTML invoices.

## Module map

- `routes/products.js`: serves product catalog data and active coupons.
- `routes/orders.js`: lists, creates, and cancels orders.
- `routes/customers.js`: returns customer/settlement data and records settlements.
- `routes/reports.js`: serves dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/store.js`: reads/writes the JSON datastore and appends audit entries.
- `lib/inventory.js`: finds products, calculates sellable stock, checks/reserves/releases stock, and summarizes inventory.
- `lib/pricing.js`: calculates subtotals, coupon discounts, per-line tax, and order totals.
- `lib/coupons.js`: normalizes, validates, calculates, and lists coupons.
- `lib/orders.js`: adds, retrieves, cancels, and lists orders.
- `lib/ledger.js`: manages customers, Khata charges/reversals, and settlements.
- `lib/tax.js`: resolves GST rates and splits GST into CGST and SGST.
- `lib/invoice.js`: computes invoice figures and renders printable HTML invoices.
- `lib/reports.js`: calculates dashboard metrics and GST reconciliation rows.
- `lib/dates.js`: formats dates, normalizes date keys, and derives fiscal years.

## Commands

- Start the app: `node server.js`
- Run tests: `node --test` (there are currently no test files in the repository).

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
