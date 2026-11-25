# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node.js and Express point-of-sale app. `server.js` wires the app and serves `public/`; `routes/` contains the products, orders, customers, and reports endpoints; `lib/` holds pricing, tax, coupon, inventory, order, ledger, storage, date, invoice, and report logic. `config.js` contains shop settings and defaults. `data/db.json` is the file-backed application store. Browser assets live in `public/index.html`, `public/js/`, and `public/css/`; architecture documentation is in `docs/`. No test directory is present.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app on the configured `PORT` (default 3000).
- There is no build script. The `npm test` script is a placeholder that exits with the failure message `Error: no test specified`; do not treat it as a passing test suite.
- Install the declared dependencies with `npm install` when setting up a development environment. No lockfile is currently present.

## Coding Style & Naming Conventions

Match the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use lower camel case for variables and functions, and descriptive lowercase filenames such as `pricing.js` or `routes/orders.js`. Keep HTTP handling in route modules and reusable business rules in `lib/`. No formatter or linter configuration is present; keep changes consistent with nearby code.

## Testing Guidelines

No test framework, test files, or coverage requirements are configured. For changes to pricing, GST, coupons, inventory, or Khata, manually verify representative cases and document what was checked in the change description. Avoid claiming automated tests passed unless a real test suite is added and run.

## Commit & Pull Request Guidelines

Git history was not available in this environment, so no established commit convention could be confirmed. Use a short imperative subject, optionally with a scope, for example `fix(pricing): apply GST after discount`. Pull requests should explain the user-visible change, note affected routes or data fields, describe verification, and include screenshots for UI changes. Call out any change to the shape or interpretation of `data/db.json`.

## Security & Configuration

Do not commit real customer data or secrets. Keep shop settings and tax/coupon configuration in `config.js`; review admin access and input validation whenever touching routes. Treat `data/db.json` as persistent business data, not disposable test output.
