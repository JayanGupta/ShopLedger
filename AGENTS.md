# Stack

- Node.js, CommonJS, Express, and body-parser; entry point: `server.js`.
- Static HTML/CSS and browser JavaScript in `public/`; JSON API mounted at `/api`.
- `config.js` holds shop, tax, coupon, inventory, port, and admin-key settings.
- `lib/store.js` synchronously reads and overwrites `data/db.json`; no database server.

# Module map

- `routes/products.js`: Product listing/filtering and active coupon listing.
- `routes/orders.js`: Order listing, lookup, placement, and cancellation.
- `routes/customers.js`: Customer/settlement listing and Khata settlement recording.
- `routes/reports.js`: Dashboard, GST reconciliation, pricing preview, and keyed database export.
- `lib/coupons.js`: Coupon normalization, lookup, validation, discount calculation, and active listing.
- `lib/dates.js`: Local-date formatting, date-key normalization, and fiscal-year labels.
- `lib/inventory.js`: Product lookup, sellable-stock checks, stock deduction/release, and summaries.
- `lib/invoice.js`: Independent invoice figure calculation and printable HTML rendering.
- `lib/ledger.js`: Customer lookup/listing, Khata charges/reversals, and settlement recording.
- `lib/orders.js`: In-memory order creation, lookup, filtering, and cancellation orchestration.
- `lib/pricing.js`: Checkout subtotal, coupon allocation, discounted line tax, and total calculation.
- `lib/reports.js`: Dashboard aggregation and stored-order versus invoice reconciliation.
- `lib/store.js`: JSON-file persistence, structure defaults, and a capped audit log.
- `lib/tax.js`: Explicit-rate or exact-HSN GST lookup, fallback rate, and CGST/SGST splitting.

# Commands

- Start the app: `node server.js` (also the command behind `npm start`).
- Run tests with Node's built-in test runner: `node --test`.
- No project test files currently exist; `npm test` is a placeholder that exits with an error.

# Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

# Current ticket

- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
- Checkout uses `lib/pricing.js` with HSN rates and discounts before tax; orders save aggregate totals.
- Invoice calculation currently ignores HSN, taxes undiscounted lines, and bypasses coupon eligibility/caps.
