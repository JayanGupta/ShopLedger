# Stack
- Node.js app using Express 4 and body-parser for JSON request bodies.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored in `data/db.json` via synchronous file reads and writes in `lib/store.js`.

# Module map
- `routes/customers.js` — lists customers and recent settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, places, and cancels orders.
- `routes/products.js` — lists products and coupons.
- `routes/reports.js` — dashboard and GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons from config.
- `lib/dates.js` — formats today's date, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers and updates Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and lists orders.
- `lib/pricing.js` — calculates subtotals, discounts, GST totals, and line breakdowns.
- `lib/reports.js` — calculates dashboard summaries and GST reconciliation.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.

# Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

# Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

# Current ticket
- Fix broken order history sorting and date filtering, and Khata settlement balance corruption.
- Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
