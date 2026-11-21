# Stack
- Node.js application using Express 4 and body-parser; browser files are served from `public/`.
- Persistent application data is stored as JSON in `data/db.json` by `lib/store.js`.

# Module map
- `routes/customers.js` — list customers and settlements; record Khata settlements.
- `routes/orders.js` — list, fetch, create, and cancel orders.
- `routes/products.js` — list products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalize, look up, validate, and calculate coupons.
- `lib/dates.js` — today’s date, normalized date keys, and fiscal year.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation, release, and summary.
- `lib/invoice.js` — invoice figures and HTML invoice rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — add, find, cancel, and list orders.
- `lib/pricing.js` — subtotal, discount, and order totals.
- `lib/reports.js` — dashboard summary and GST reconciliation data.
- `lib/store.js` — read/write the JSON database and append audit entries.
- `lib/tax.js` — tax rates, slab percentages, and CGST/SGST split.

# Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

# Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

# Current ticket
- Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
- Allowed files: `lib/inventory.js` and `lib/orders.js` (cancel only).
