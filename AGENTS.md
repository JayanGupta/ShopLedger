# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express POS, Khata credit ledger, and GST invoicing app. `server.js` configures middleware, mounts `/api` routers, and serves printable invoices. `routes/` contains products, orders, customers, and reports handlers. `lib/` holds pricing, tax, coupons, inventory, orders, ledger, dates, persistence, reports, and invoice logic. `config.js` defines shop details and business rules. `public/` contains HTML, CSS, and browser JavaScript. `data/db.json` stores all persistent records. See `docs/architecture.svg` for the module map. No test directory currently exists.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json` when setup is authorized.
- `npm start`: run `node server.js`; the default port is 3000. Override with `PORT=3001 npm start`.
- `npm test`: currently prints “Error: no test specified” and exits unsuccessfully; it does not validate changes.

There is no build, lint, or formatting script. Local orders, cancellations, and settlements rewrite `data/db.json`; use disposable data when exercising mutations.

## Coding Style & Naming Conventions

Match existing CommonJS modules (`require`, `exports`), two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use camelCase for functions and variables and lowercase filenames such as `pricing.js`. Keep HTTP handling in `routes/` and business calculations in `lib/`. Avoid unrelated style migrations.

## Testing Guidelines

No testing framework, coverage threshold, or test naming convention is configured. For new automated tests, use descriptive names such as `pricing.test.js` and document the runner. Prioritize mixed GST slabs, coupon caps, rounding, stock boundaries, cancellations, and Khata settlement types. Compare checkout totals with printable invoice figures: `lib/pricing.js` and `lib/invoice.js` currently calculate independently. Report exactly what was checked; do not describe the placeholder test script as passing.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase descriptive subjects, such as `invoice page for accountant`; no formal prefix convention is evident. Keep commits focused. PRs should describe the behavior change, linked issue when available, verification performed, and effects on stored data. Include screenshots for UI or invoice layout changes.

## Security & Data Handling

Treat customer and financial records as sensitive. Avoid committing incidental database mutations or new secrets. `config.js` contains a hardcoded admin key; do not copy it into logs or documentation. Preserve explicit read-only task constraints.
