# Repository Guidelines

## Project Structure & Module Organization

- `server.js` configures Express, serves static assets, mounts `/api` routers, and exposes printable invoices.
- `routes/` contains product, order, customer/settlement, and reporting endpoints.
- `lib/` contains business logic: pricing, GST, coupons, inventory, orders, Khata balances, invoices, reports, dates, and storage. Keep HTTP handling in routes and reusable calculations here.
- `public/` contains `index.html`, `js/app.js`, and `css/style.css`; there is no frontend build pipeline.
- `config.js` defines shop details, tax slabs, coupon rules, and inventory settings. `data/db.json` stores application records and ID counters.
- `docs/architecture.svg` maps the modules and order flow. No test directory currently exists.

## Build, Test, and Development Commands

- `npm install`: install dependencies when setup is authorized.
- `npm start`: run `node server.js`, using `PORT` or port 3000 by default.
- `PORT=3001 npm start`: run locally on an alternate port.
- `npm test`: currently prints “Error: no test specified” and exits unsuccessfully; it is not a functioning test suite.

No build, lint, formatting, or development-watch scripts are configured. Respect task-specific restrictions on installation and server execution.

## Coding Style & Naming Conventions

Match surrounding JavaScript: two-space indentation, semicolons, single-quoted strings, `var`, and CommonJS `require`/`exports`. Use camelCase functions and variables, lowercase module filenames, and plural resource router filenames such as `routes/orders.js`. Keep changes focused; avoid unrelated style conversions or new dependencies.

## Testing Guidelines

No testing framework, coverage threshold, or established test naming convention is configured. For new automated tests, use descriptive names such as `test/pricing.test.js` and document the execution command. Cover GST slabs, coupon minimums/caps, rounding, inventory boundaries, cancellation, and numeric Khata settlements. Run mutation checks against an isolated disposable copy: storage hardcodes `data/db.json`.

## Commit & Pull Request Guidelines

Existing commits use short, lowercase descriptive subjects without Conventional Commit prefixes. Follow that pattern, for example `fix invoice coupon discount cap`. PRs should explain the problem, resulting behavior, relevant issue, and validation performed. Include before/after amounts for financial changes and screenshots for UI changes; identify any persisted-data impact.

## Financial Data & Security

Review checkout (`lib/pricing.js`) and printing (`lib/invoice.js`) together: their calculations currently differ. Preserve historical amounts deliberately. Do not commit real customer data or additional secrets; flag the existing hardcoded admin key. Avoid incidental database writes and preserve unrelated working-tree changes.
