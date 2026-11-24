# Repository Guidelines

## Stack

- Node.js with CommonJS JavaScript, Express 4, and `body-parser` JSON middleware.
- Browser UI uses HTML, CSS, and vanilla JavaScript in `public/`.
- Persistent application data is stored in `data/db.json` through `lib/store.js`.

## Module map

### `routes/`

- `routes/customers.js` — lists customer balances and records Khata settlements.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export.

### `lib/`

- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, updates, and summaries.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — checkout subtotal, coupon discount, GST, and totals.
- `lib/reports.js` — dashboard summaries and invoice/order GST reconciliation.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits CGST/SGST.

## Commands

- `npm start` — starts the app with `node server.js` (default port 3000; `PORT` can override it).
- `node --test` — runs Node’s built-in test runner. No test files or test framework are currently present.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
