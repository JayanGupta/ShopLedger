# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express POS, inventory, Khata ledger, and GST invoicing app. `server.js` mounts the API and serves the browser app. API handlers live in `routes/`; business logic is split among `lib/` modules for orders, inventory, pricing, tax, ledger, invoices, coupons, reports, dates, and JSON storage. The UI is in `public/` (`index.html`, `js/`, `css/`). Shop settings and coupon/GST configuration are in `config.js`; application records are stored in `data/db.json`. There is no separate test directory in the repository.

## Build, Test, and Development Commands

- `npm start` — starts the Express app at `http://localhost:3000` (or the configured `PORT`).
- `npm test` — currently a placeholder that exits with “Error: no test specified”; do not treat it as a passing test suite.

There is no build script or configured linter/formatter. Keep changes focused and inspect relevant API and UI paths manually.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, `var`, semicolon-terminated statements, and single-quoted strings. Use lowercase filenames such as `lib/inventory.js`; exported business functions use camelCase (for example, `getSellableStock`). Keep route handlers thin and put reusable business rules in `lib/` modules.

## Testing Guidelines

No test framework, test files, or coverage target is configured. For changes, add focused tests if introducing a framework is in scope; otherwise document manual checks, including affected API behavior and persisted JSON changes. Do not claim `npm test` validates the application.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries, often naming the feature or affected area (for example, `customer khata credit ledger and order cancellation`). Follow that style. Pull requests should explain user-visible behavior, list important implementation changes, describe validation performed, and include screenshots for browser UI changes. Call out changes to `data/db.json` or accounting calculations explicitly.

## Security & Data Handling

Treat `data/db.json` as application data: preserve its schema and avoid committing real customer information. Review `config.js` before deployment; it contains shop details, coupon/GST settings, and a hardcoded admin key. Do not expose sensitive records through new routes or logs.
