# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express POS, inventory, Khata ledger, and GST invoicing app. `server.js` wires the app and serves `public/`; `routes/` contains API handlers; `lib/` holds business logic for orders, pricing, tax, inventory, coupons, ledger, reports, invoices, dates, and JSON storage. `config.js` contains shop and tax settings. `data/db.json` is the local persistent store. Browser assets live in `public/index.html`, `public/js/`, and `public/css/`. `docs/architecture.svg` diagrams the application. There is currently no test directory.

## Build, Test, and Development Commands

- `npm start` runs the local Express server at `http://localhost:3000` (or the configured `PORT`).
- `npm test` is currently a placeholder that exits with “no test specified”; do not treat it as a passing test suite.
- No build, lint, or formatter scripts are configured. Install dependencies with `npm install` when setting up a development environment; do not commit generated dependency directories.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use lower camel case for functions and variables, and lowercase descriptive filenames such as `pricing.js` and `orders.js`. Keep HTTP/request handling in `routes/` and reusable business rules in `lib/`. Preserve the established JSON response patterns and round monetary calculations to two decimal places where appropriate.

## Testing Guidelines

No automated test framework or coverage target is present. For changes to calculations or persistence, add focused tests if introducing a test framework, and cover normal cases plus invalid inputs and rounding boundaries. Until tests exist, document manual verification steps in the pull request; avoid claiming `npm test` validates behavior.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that style and keep each commit focused. Pull requests should explain the behavior change, list verification performed, link relevant issues when available, and include screenshots for visible UI changes. Call out changes to pricing, tax, inventory, Khata, or `data/db.json` explicitly.

## Security & Data Configuration

Do not commit real customer or transaction data. Treat `data/db.json` as persistent mutable state and back it up before manual edits. `config.js` currently contains an admin key and shop/GST details; do not add production secrets there, and move deployment-specific secrets to environment configuration before exposing the app beyond a trusted local environment.
