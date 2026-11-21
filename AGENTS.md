# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node.js/Express POS, inventory, Khata ledger, and invoicing app. `server.js` wires the application and serves the browser UI from `public/` (`index.html`, `js/app.js`, `css/style.css`). API endpoints live in `routes/`; business logic is in `lib/` (pricing, tax, coupons, inventory, orders, ledger, persistence, reports, dates, and invoice rendering). `config.js` holds shop, GST, coupon, and runtime settings. `data/db.json` is the file-backed application store. `docs/architecture.svg` diagrams the main components and order flow. There is no test directory currently.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app at `http://localhost:3000` (or the configured `PORT`).
- `npm test` is a placeholder that exits with “no test specified”; it does not run tests.
- No build, lint, or formatting command is configured. Do not treat a successful `npm test` as verification; it currently fails by design.

## Coding Style & Naming Conventions

Use the existing CommonJS JavaScript style: `require()` imports, `module.exports`/`exports` exports, two-space indentation, semicolons, and single-quoted strings. Follow nearby naming patterns: lower camel case for functions and variables (`computeTotals`), lower-case filenames such as `pricing.js`, and Express route paths grouped by resource. Keep route handlers focused on request validation and orchestration; put reusable business rules in `lib/`. Preserve the established JSON shape when changing persisted records.

## Testing Guidelines

There is no test framework or coverage requirement configured. For behavior changes, add focused tests if introducing a test setup, especially around checkout totals, GST slabs, coupon limits, stock changes, Khata balances, and invoice reconciliation. Until then, document manual verification steps in the change description; do not claim `npm test` validates behavior.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Keep commits focused and use a similarly clear summary. Pull requests should explain the behavior change, note affected routes/data, list verification performed, and include screenshots for visible UI changes. Call out changes to invoice figures or stored JSON fields explicitly.

## Security & Configuration

Do not commit real customer data or secrets. `data/db.json` contains mutable business records, and `config.js` currently includes sensitive configuration such as an admin key; handle both carefully and move secrets to environment-based configuration when changing that area. Keep validation on the server even when the browser already checks inputs.
