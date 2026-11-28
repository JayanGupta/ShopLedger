# Repository Guidelines

## Project Structure & Module Organization

This is a CommonJS Node/Express point-of-sale app. `server.js` serves the static browser UI in `public/` and mounts API routers in `routes/`. Business logic is in `lib/` (pricing, tax, coupons, inventory, orders, Khata ledger, reports, storage, dates, and invoice rendering). `config.js` contains shop, tax, inventory, and coupon settings. The JSON store is `data/db.json`; tests belong in `test/`, and the architecture diagram is in `docs/`.

## Build, Test, and Development Commands

- `npm start` — starts `node server.js` (port 3000 unless `PORT` is set).
- `node --test` — runs tests using Node’s built-in test runner.

There is no build or lint script. The current `npm test` script is a placeholder that exits with an error; use `node --test` for tests.

## Coding Style & Naming Conventions

Follow the existing JavaScript style: two-space indentation, CommonJS `require`/`module.exports`, and camelCase for functions and variables. Route files are named for their resource (`routes/orders.js`); tests use `*.test.js` (for example, `test/invoice.test.js`). No formatter or linter is configured. Keep changes focused and avoid adding dependencies.

## Testing Guidelines

Use `node:test` and `node:assert` for tests. Name tests to describe the behavior they cover; characterization tests should begin with `CURRENT BEHAVIOUR:` when they pin existing behavior. Keep test data in memory: tests must not read or write `data/db.json`. Run `node --test` after changing behavior and ensure all tests pass.

## Commit & Pull Request Guidelines

Recent history uses short, descriptive, lowercase commit subjects (for example, `invoice page for accountant`); no stricter commit convention is evident. Keep commits focused. A pull request should explain the behavior changed, list affected modules, and report test results; include screenshots when the browser UI changes.

## Security & Configuration

Do not commit secrets or real customer information. Treat `config.js` as application configuration and `data/db.json` as business data; avoid including database contents in tests, logs, or reviews.

## Agent-Specific Instructions

For the current invoice reconciliation ticket, add characterization tests before behavior changes. Limit implementation changes to `lib/invoice.js`; change `lib/tax.js` only if the fix truly requires it. Keep tests in-memory and make the smallest working change.
