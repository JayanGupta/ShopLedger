# Repository Guidelines

## Project Structure & Module Organization
- `server.js` wires the Express app, static `public/` files, and API routes. `config.js` holds the port, shop settings, tax slabs, inventory defaults, and coupons.
- `routes/` contains `customers.js`, `orders.js`, `products.js`, and `reports.js`; business logic lives in `lib/` (pricing, tax, invoices, inventory, ledger, reports, dates, coupons, orders, and JSON storage).
- `public/` contains `index.html`, `css/`, and `js/app.js`. `data/db.json` is the local data store. Tests belong in `test/`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm start` starts the app with `node server.js` (default port 3000; `PORT` can override it).
- `node --test` runs the Node.js built-in test suite.
- There is no build or lint script. The current `npm test` script is a placeholder that exits with an error; use `node --test`.

## Coding Style & Naming
Use CommonJS modules (`require` and `module.exports`), two-space indentation, semicolons, and camelCase for functions and variables. Follow the neighboring file's declaration style: application modules commonly use `var`; tests use `const`. No formatter or linter is configured.

## Testing Guidelines
Add behavior-focused tests under `test/*.test.js` with `node:test` and `node:assert/strict`. Write characterization tests before changing behavior. Keep test data in memory; tests must never read or write `data/db.json`. Cover totals, tax breakdowns, and relevant edge cases.

## Commit & Pull Request Guidelines
Recent history uses short, descriptive, mostly lowercase subjects (for example, `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`); no strict prefix convention is evident. PRs should explain cause and fix, list test results, link the issue, and include screenshots when UI changes need visual review.

## Data & Configuration
Treat `data/db.json` as application data, not a test fixture. Keep shop details, tax settings, coupon rules, and the admin key in `config.js`; do not add real credentials to the repository.