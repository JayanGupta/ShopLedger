# Repository Guidelines

## Project Structure & Module Organization

`server.js` configures Express, serves static files, and mounts the API routers in `routes/`. Business logic lives in `lib/`: inventory, orders, pricing, tax, coupons, Khata ledger, invoices, reports, dates, and JSON storage. `config.js` holds shop settings, tax slabs, coupons, and inventory defaults. The browser UI is in `public/`; persistent application data is in `data/db.json`. See `docs/architecture.svg` for the order flow. Inventory and cancellation tests are in `test/inventory.test.js`.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` starts the Express server on port 3000, or the port specified by `PORT`.
- `node --test` runs the automated tests.
- `npm test` currently prints “Error: no test specified” and exits unsuccessfully; it is not an automated test suite.

There is no build script. Running the app and exercising write endpoints changes `data/db.json`; use disposable data or back it up before manual testing.

## Coding Style & Naming Conventions

Follow the surrounding JavaScript: two-space indentation, semicolons, single-quoted strings, CommonJS `require`/`exports`, and camelCase functions and variables. Module filenames are lowercase, such as `inventory.js`; keep HTTP handlers in `routes/` and reusable calculations in `lib/`. No formatter or linter is configured in `package.json`.

## Testing Guidelines

Tests use the built-in Node.js test runner and in-memory data. For behavior changes, add focused automated tests when practical and document how to run them. At minimum, describe manual checks and their results in the pull request. Exercise order placement and cancellation, stock boundaries, Khata balances, and invoice totals when touching those paths; avoid relying on the placeholder `npm test` as a passing check.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subjects, for example `customer khata credit ledger and order cancellation`. Keep each subject focused on the change. Pull requests should explain the problem and behavior change, list verification performed, and link a relevant issue when available. Include screenshots for visible UI changes and call out data or configuration changes.

## Security & Data Handling

`config.js` contains a hard-coded admin key, and `data/db.json` contains customer and transaction records. Do not add real credentials or unnecessary personal data to commits. Review changes to inventory, GST, invoices, and ledger calculations carefully: these affect stock and financial records.
