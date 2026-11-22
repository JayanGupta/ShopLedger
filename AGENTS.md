# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node/Express POS, Khata credit ledger, and GST invoicing app. `server.js` configures Express, serves static assets, mounts `/api` routers, and exposes printable invoices. `routes/` contains products, orders, customers, and reports handlers. `lib/` contains pricing, coupons, tax, inventory, ledger, orders, invoices, reports, dates, and persistence logic. Keep HTTP handling in routers and business calculations in libraries.

`public/` holds `index.html`, `js/app.js`, and `css/style.css`. `config.js` defines shop details and business settings. `data/db.json` is the writable database. `test/invoice.test.js` covers invoice pricing with in-memory fixtures. See `docs/architecture.svg` for the module map.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm start`: run `node server.js`; the default port is 3000.
- `PORT=3001 npm start`: run on another port.
- `npm test`: currently prints “Error: no test specified” and exits unsuccessfully; it does not validate changes.
- `node --test`: run the invoice tests using Node's built-in test runner.

There is no build, lint, or formatting script. Use a disposable checkout for manual testing: order creation, cancellation, and settlements overwrite `data/db.json`.

## Coding Style & Naming Conventions

Match existing JavaScript: two-space indentation, semicolons, single-quoted strings, CommonJS `require`, and `exports` functions. Existing modules use `var` and traditional functions. Use camelCase for variables/functions and lowercase filenames such as `pricing.js`. Avoid unrelated style rewrites or introducing tooling for small changes.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`; no coverage threshold is configured. Use `test/*.test.js` filenames and in-memory fixtures. For calculation changes, verify mixed GST slabs, coupon minimums/caps, rounding, and agreement between checkout and printable invoices. For state changes, verify stock deductions/restoration and Khata charges/settlements. Document inputs and expected results; never use the database as a test fixture.

## Commit & Pull Request Guidelines

History uses short, lowercase descriptive subjects, such as `invoice page for accountant`; no enforced prefix convention is evident. Keep commits focused. PRs should explain the problem, resulting behavior, validation performed, and any data impact. Link the relevant ticket and include screenshots for UI or invoice changes.

## Security & Accounting Boundaries

Do not commit customer data or credentials. Configuration contains a hardcoded admin key; avoid copying it into documentation. Invoice (`lib/invoice.js`) reuses checkout calculations from `lib/pricing.js`. Review both when changing GST or coupons, and preserve agreement between billed figures and invoices.
