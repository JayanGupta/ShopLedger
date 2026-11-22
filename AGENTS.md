# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express point-of-sale and Khata ledger app. `server.js` mounts API routes and serves the browser app. `routes/` contains Express endpoints; `lib/` holds pricing, GST, coupons, inventory, orders, ledger, reporting, invoice, date, and JSON-store logic. `config.js` contains shop and operating settings. The UI is in `public/` (`index.html`, `js/`, and `css/`). `data/db.json` is the local application database. Architecture is documented in `docs/architecture.svg`; automated tests live in `test/`.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and listens on port 3000 by default; set `PORT` to override it.
- `node --test` runs the built-in Node test suite without adding dependencies.
- `npm test` remains a placeholder that exits with an error; it is not the test command.
- No build, lint, or formatting command is defined. Do not imply a command validates the project unless one is added and documented.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var` declarations. Use lowercase filenames such as `pricing.js`; export library functions through `exports.name`. Keep HTTP handling in `routes/` and reusable business logic in `lib/`. Avoid duplicating calculations across modules; checkout and invoice totals should be reviewed together when changing pricing or GST behavior.

## Testing Guidelines

Use `node:test` and `node:assert` with in-memory fixtures. Never read or write `data/db.json` from tests. Before changing behavior, add a failing regression case for the reported scenario and cover mixed GST slabs, coupon caps/minimums, rounding, invoice figures, and parity with checkout totals as relevant. Do not add dependencies for tests.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase, descriptive subjects (for example, `support hsn gst slabs and coupon maxDiscount caps`). Keep commits focused and summarize the user-visible or data-impacting change. Pull requests should explain the behavior changed, list verification performed, note any migration or data-file impact, and include UI screenshots when the browser interface changes. Link related issues when available.

## Security & Data Handling

Do not commit credentials or real customer data. `config.js` currently contains an admin key and shop details; treat these as sensitive and move secrets to environment configuration before production use. `data/db.json` is mutable business data; preserve backups and avoid overwriting it during development.

## Change Scope

Keep fixes ticket-scoped. For invoice amount changes, use checkout pricing/tax rules as the authority and preserve stored order fields and existing order history. Avoid unrelated refactors.
