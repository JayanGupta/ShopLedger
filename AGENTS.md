# Repository Guidelines

## Project Structure & Module Organization

`server.js` starts the Express app and mounts API routers. `routes/` contains Express endpoints; `lib/` contains pricing, tax, coupon, inventory, order, invoice, ledger, storage, date, and report logic. `public/` holds the static HTML, browser JavaScript, and CSS. `config.js` contains shop and application settings, while `data/db.json` is the local JSON store. `docs/` contains project documentation and diagrams. There is no existing test directory.

## Build, Test, and Development Commands

- `npm start` — starts the app using `node server.js` (default port 3000).
- `node --test` — runs tests discovered by Node’s built-in test runner; no test files are currently present.
- `npm test` — currently exits with “no test specified”; do not treat it as a passing test command.

There is no build or lint script configured in `package.json`.

## Coding Style & Naming Conventions

Match the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `camelCase` for variables and functions. Route and library files use lowercase descriptive names such as `routes/orders.js` and `lib/pricing.js`. Keep business rules in the relevant `lib/` module and HTTP request/response handling in `routes/`. No formatter or linter is configured.

## Testing Guidelines

Use Node’s built-in `node:test` and `node:assert` modules for tests, with descriptive `*.test.js` names. Add characterization coverage before changing behavior. Keep test fixtures in memory; tests must not read from or write to `data/db.json`. No coverage threshold is configured. Run `node --test` after adding tests.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subjects (for example, `invoice page for accountant`). Follow that style and describe the behavior changed. Pull requests should explain the change, list relevant verification commands and results, and include screenshots for visible UI changes. No issue-linking or PR template convention is configured.

## Configuration & Data Safety

Do not add dependencies without need. Keep changes focused on the modules involved, make the smallest effective change, and avoid committing real customer or transaction data. Treat `data/db.json` as mutable application data, not a test fixture.
