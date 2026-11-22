# Stack
- Node.js CommonJS application using Express 4 and body-parser for JSON request bodies.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Operational records are read from and written to `data/db.json` by `lib/store.js`.

# Module map
## routes/
- `routes/customers.js` — lists customers and recent settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/products.js` — lists/searches products and lists active coupons.
- `routes/reports.js` — dashboard and GST reports, pricing preview, and keyed data export.
## lib/
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers and updates Khata billing, reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and lists orders.
- `lib/pricing.js` — computes subtotals, discounts, taxes, and order totals.
- `lib/reports.js` — builds dashboard summaries and GST reconciliation.
- `lib/store.js` — reads/writes the JSON store and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits CGST/SGST.

# Commands
- Start the app: `npm start` (`package.json` runs `node server.js`).
- Run tests: `node --test`.

# Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

# Current ticket
- Reported issues: Order History sorting/date-range filtering and Khata settlement balance corruption.
- Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
