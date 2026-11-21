# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node.js/Express POS, inventory, Khata ledger, and GST invoicing app. `server.js` wires the Express app and serves `public/`; `routes/` contains API endpoints, and `lib/` holds pricing, tax, coupon, order, inventory, ledger, storage, date, and report logic. `config.js` contains shop and business defaults. `data/db.json` is the file-backed application data. Browser assets live in `public/index.html`, `public/js/`, and `public/css/`. Supporting documentation and diagrams belong in `docs/`. No test directory or test files are currently present.

## Build, Test, and Development Commands

- `npm start` starts the local server at the configured `PORT`, or port 3000 by default.
- `npm test` currently exits with “no test specified”; it does not run a test suite.

Install dependencies with `npm install` when setting up a development environment. Do not use production data for local experiments: the application writes changes directly to `data/db.json`.

## Coding Style & Naming Conventions

Follow the existing CommonJS style (`require`/`module.exports`) and JavaScript conventions: two-space indentation, semicolons, single-quoted strings, and descriptive camelCase function and variable names. Name route files for their resource or area (for example, `routes/orders.js`) and keep reusable business rules in `lib/`. Preserve the existing separation between request handling, business logic, and JSON persistence. No formatter or linter is configured; keep changes consistent with nearby code.

## Testing Guidelines

There is no configured test framework, coverage threshold, or test naming convention. For changes, manually exercise the affected API or UI flow in a disposable local data copy and review edge cases, especially order quantities, stock availability, coupon limits, GST slabs, and Khata balances. Add automated tests when introducing a test framework, and document how to run them.

## Commit & Pull Request Guidelines

Recent commit subjects are short, imperative feature summaries (for example, “support hsn gst slabs and coupon maxDiscount caps”). Use a concise action-oriented subject. Pull requests should explain the behavior change, list affected routes/modules, describe validation performed, and include screenshots for visible UI changes. Call out any changes to persisted JSON shape or billing calculations.

## Security & Configuration

Keep credentials and deployment-specific settings out of source control. `config.js` currently includes shop details, coupon and tax settings, and a fixed admin key; treat changes to those values as sensitive. Avoid committing real customer or transaction data from `data/db.json`.
