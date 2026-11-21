
# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Node.js/Express POS, inventory, Khata ledger, and GST invoicing application. The entry point is `server.js`; `config.js` contains shop, tax, inventory, coupon, and port settings. API routers are in `routes/`. Business logic is in `lib/` (including inventory, orders, pricing, ledger, reports, tax, and invoices). The browser interface and assets are in `public/`; `data/db.json` is the local JSON data store. Tests are located in `test/`.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and starts the local server (default port 3000; override with `PORT`).
- `node --test` runs the test suite using Node.js's built-in test runner.
- `npm test` is currently a placeholder that exits with an error; do not treat it as a passing test suite.
- No build, lint, or formatting scripts are configured.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var` declarations. Use lowercase, descriptive filenames such as `inventory.js`; exported functions use camelCase (for example, `getSellableStock`). Keep HTTP handling in `routes/` and reusable business rules in `lib/`. Avoid adding dependencies or introducing tooling without a clear need.

## Testing Guidelines

Use Node.js's built-in `node:test` and `node:assert/strict` modules. Place tests in the `test/` directory and run them with `node --test`. Add characterization tests before changing existing behavior, then add regression tests for the intended behavior. Use in-memory or temporary fixtures. Never run tests against or modify the real `data/db.json`. Cover relevant stock boundaries, order cancellation, and other affected business rules.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, "support hsn gst slabs and coupon maxDiscount caps"). Follow that pattern and describe the behavior changed. Pull requests should explain the user-visible impact, list affected routes or library modules, include verification steps, and provide screenshots for UI changes. Call out any changes to the JSON data shape or configuration.

## Security & Data Handling

Do not commit real customer or payment data. `data/db.json` is application data, and `config.js` currently contains an admin key; keep secrets out of source control and avoid exposing database exports. Treat changes to this file or configuration as sensitive.
