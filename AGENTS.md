# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express POS, inventory, Khata ledger, and GST invoicing app. `server.js` starts the app and mounts API routes. Keep HTTP handlers in `routes/` and business logic in `lib/` (for example, checkout totals in `lib/pricing.js`). `config.js` contains shop, tax, inventory, and coupon settings. The browser UI lives in `public/` (`index.html`, `js/app.js`, and `css/style.css`). `data/db.json` is the file-backed application store. `docs/` contains repository documentation and diagrams. There is no test directory or configured test framework.

## Build, Test, and Development Commands

- `npm start` — run the local Express server at the configured port (3000 by default).
- `npm test` — currently a placeholder that exits with an error; no automated test suite is configured.

There is no separate build, lint, or formatting script. Install dependencies from the lockfile with `npm ci` when setting up a development checkout.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var` declarations. Use lowercase filenames such as `routes/orders.js`; export module functions through `exports.name`. Keep route handlers focused on request validation and orchestration, and put reusable calculations or state changes in `lib/`. No formatter or linter is configured, so keep changes consistent with nearby code.

## Testing Guidelines

No test framework, test files, or coverage threshold is currently present. For changes, manually verify the affected browser/API flow and describe the steps and outcome in the pull request. Add automated tests when introducing a test framework; use names that identify the module and behavior, such as `pricing.test.js`.

## Commits & Pull Requests

Recent history uses short, lowercase, descriptive subjects (for example, `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`). Follow that style and keep each commit focused. Pull requests should explain the behavior change, list verification performed, link related work when available, and include screenshots for visible UI changes.

## Security & Data Handling

Do not commit real customer or transaction data. `data/db.json` contains application records and is read and rewritten as a whole by `lib/store.js`; back it up before manual edits. Keep credentials and deployment-specific secrets out of source control, and do not treat the development admin key in `config.js` as production authentication.
