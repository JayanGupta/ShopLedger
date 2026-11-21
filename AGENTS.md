# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Node.js/Express POS, inventory, Khata ledger, and GST invoicing application. The entry point is `server.js`; `config.js` contains shop, tax, inventory, coupon, and port settings. API routers are in `routes/`. Business logic is in `lib/` (including inventory, orders, pricing, ledger, reports, tax, and invoices). The browser interface and assets are in `public/`; `data/db.json` is the local JSON data store. There is no test directory or documented test suite.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and starts the local server (default port 3000; override with `PORT`).
- `npm test` is currently a placeholder that exits with an error; do not treat it as a passing test suite.
- No build, lint, or formatting scripts are configured. For code changes, inspect the affected routes and library modules together; order and inventory behavior crosses both layers.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var` declarations. Use lowercase, descriptive filenames such as `inventory.js`; exported functions use camelCase (for example, `getSellableStock`). Keep HTTP handling in `routes/` and reusable business rules in `lib/`. Avoid adding dependencies or introducing tooling without a clear need.

## Testing Guidelines

There is no configured test framework, and the `npm test` script is only a failure placeholder. If adding tests, establish and document a real test runner and place tests in a clearly named `test/` or `tests/` directory. Cover stock boundary conditions, order cancellation and Khata reversal, and pricing calculations when changing those areas.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, “support hsn gst slabs and coupon maxDiscount caps”). Follow that pattern and describe the behavior changed. Pull requests should explain the user-visible impact, list affected routes or library modules, include verification steps, and provide screenshots for UI changes. Call out any changes to the JSON data shape or configuration.

## Security & Data Handling

Do not commit real customer or payment data. `data/db.json` is application data, and `config.js` currently contains an admin key; keep secrets out of source control and avoid exposing database exports. Treat changes to this file or configuration as sensitive.
