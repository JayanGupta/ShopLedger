# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node/Express POS, Khata credit ledger, and GST invoicing app.

- `server.js` configures Express, mounts `/api` routers, serves `public/`, and exposes printable invoices.
- `routes/` contains product, order, customer/settlement, and report HTTP handlers.
- `lib/` contains pricing, tax, coupons, inventory, orders, ledger, invoices, reports, dates, and persistence logic. Keep business rules here rather than in browser code.
- `public/` contains `index.html`, `js/app.js`, and `css/style.css`; no frontend build is configured.
- `config.js` holds shop details, GST slabs, coupons, and server settings.
- `data/db.json` stores mutable application data. `docs/architecture.svg` maps the architecture and order flow.

## Build, Test, and Development Commands

These commands are reference instructions; run them only within the authorized task scope.

- `npm ci`: install dependencies from an available, synchronized lockfile.
- `npm start`: run `node server.js` on port 3000 by default.
- `PORT=3001 npm start`: select another port.
- `npm test`: currently prints “Error: no test specified” and exits unsuccessfully.

No build, lint, formatting, or development-watch scripts are configured.

## Coding Style & Naming Conventions

Follow existing JavaScript: two-space indentation, semicolons, single-quoted strings, CommonJS `require`/exports, and `var` declarations. Use camelCase functions and variables, such as `computeTotals` and `customerId`, and lowercase module filenames. Keep route handlers focused on request validation and orchestration. Avoid unrelated style rewrites.

## Testing Guidelines

No test framework, test directory, coverage threshold, or test naming convention is established. For new automated coverage, prefer `tests/<module>.test.js` and document its runner. Verify monetary changes with explicit expected subtotal, discount, tax, and total values. Cover mixed GST slabs, coupon limits, rounding, stock boundaries, cancellations, and Khata settlements. Use disposable data for checks that write orders or balances.

## Commit & Pull Request Guidelines

History uses short, lowercase descriptive subjects, such as `invoice page for accountant`; no Conventional Commits pattern is established. Keep commits focused. PRs should explain the behavior change, link an issue when applicable, list verification and limitations, and include screenshots for UI or invoice changes. Exclude incidental database mutations.

## Data & Pricing Precautions

`lib/store.js` rewrites the entire JSON database synchronously. Preserve existing data and unrelated changes. Checkout uses `lib/pricing.js`, `lib/tax.js`, and `lib/coupons.js`; invoices independently recalculate in `lib/invoice.js`. Compare both paths when changing totals. Treat the hardcoded admin key and customer records as sensitive.
