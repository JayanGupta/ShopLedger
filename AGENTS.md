# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node/Express POS, Khata credit ledger, and GST invoicing app. `server.js` mounts routers and serves the browser UI and printable invoices. `config.js` contains shop details, tax slabs, coupons, and runtime settings.

- `routes/`: product, order, customer, and report HTTP handlers.
- `lib/`: pricing, tax, coupons, inventory, ledger, orders, invoices, reports, dates, and persistence logic.
- `public/`: `index.html`, `js/app.js`, and `css/style.css`; no frontend build pipeline.
- `data/db.json`: mutable application data, including stock, accounts, orders, and settlements.
- `docs/architecture.svg`: module map and numbered order flow.

No test directory or automated test framework is currently present.

## Build, Test, and Development Commands

Run commands from the repository root when execution is authorized:

- `npm install`: install the declared Express and body-parser dependencies.
- `npm start`: run `node server.js`; the default port is 3000, overridable with `PORT`.
- `npm test`: currently prints “Error: no test specified” and exits unsuccessfully; it does not validate changes.

There are no build, lint, or formatting scripts. Do not run installation or server commands during a read-only review.

## Coding Style & Naming Conventions

Match existing JavaScript: two-space indentation, semicolons, single-quoted strings, CommonJS `require`/`exports`, and camelCase functions and variables. Existing code uses `var` and function expressions; avoid unrelated syntax modernization. Use lowercase module filenames such as `pricing.js`. Keep request handling in `routes/` and reusable business calculations in `lib/`.

## Testing Guidelines

No coverage threshold or test naming convention is established. For new automated tests, prefer descriptive names such as `pricing.test.js` and document the runner. Cover mixed GST slabs, coupon caps, rounding, stock boundaries, cancellations, and Khata settlements. Compare checkout totals with printable invoice figures: their implementations currently differ. Use isolated fixtures rather than modifying the checked-in database; report manual checks and untested behavior explicitly.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase descriptive subjects, for example `invoice page for accountant`; no Conventional Commits prefix is established. Keep commits focused. PRs should describe the problem, resulting behavior, validation, and any data impact; link applicable issues and include screenshots for UI or invoice changes.

## Security & Data Handling

The store rewrites the entire JSON database synchronously. Avoid incidental data changes. Do not add secrets or customer information to commits. Configuration contains a hard-coded admin key; ordinary routes lack authentication. Treat deployment access controls as a separate concern requiring verification.
