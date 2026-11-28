# Repository Guidelines

## Project Structure & Module Organization

This is a CommonJS Node.js and Express application. `server.js` mounts the API routers and serves the browser app. Keep HTTP handlers in `routes/`, business logic in `lib/`, and shop, tax, coupon, and inventory defaults in `config.js`. The browser UI is in `public/` (`index.html`, `js/app.js`, and `css/style.css`). Persistent sample/runtime data is in `data/db.json`; the architecture diagram is in `docs/architecture.svg`. There is currently no test directory.

## Build, Test, and Development Commands

- `npm start` — starts the local server with `node server.js` (default port 3000; `PORT` can override it).
- `npm test` — currently a placeholder that prints “no test specified” and exits with failure; do not treat it as a passing test suite.

There is no build, lint, or formatting script configured. Do not run the server against important data: order and settlement routes write directly to `data/db.json`.

## Coding Style & Naming Conventions

Match the existing JavaScript style: CommonJS `require`/`module.exports`, two-space indentation, semicolons, single-quoted strings, and `camelCase` functions and variables. Use descriptive lowercase filenames such as `pricing.js` or `orders.js`. Keep route handlers focused on request/response handling and place reusable calculations or state changes in `lib/`. Preserve the existing JSON data shape unless a change includes a deliberate migration.

## Testing Guidelines

No test framework, test files, coverage target, or working test command is configured. For changes, describe the checks performed and add focused tests when introducing a test framework or extending an established one. Avoid changing `data/db.json` during manual checks unless that data change is intended.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase, descriptive commit subjects (for example, `customer khata credit ledger and order cancellation`); no stricter convention is evident. Keep commits focused. Pull requests should explain the user-visible behavior and data impact, list checks performed, link related issues when available, and include screenshots for UI changes. Call out any changes to tax, pricing, or persisted data explicitly.

## Security & Configuration

Review `config.js` before deployment: it contains application settings and a hard-coded admin key. Do not add real credentials or customer data to commits. Treat `data/db.json` as mutable application state and preserve a backup before intentional manual edits.
