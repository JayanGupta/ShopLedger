# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is an Express application. `server.js` composes middleware, static hosting, API routers, and the invoice route. Keep HTTP handlers in `routes/` (`products.js`, `orders.js`, `customers.js`, `reports.js`) and reusable logic in `lib/` (pricing, tax, inventory, ledger, reporting, and storage). The browser client is in `public/`: `index.html`, `css/style.css`, and `js/app.js`. Runtime data is `data/db.json`; treat it as demo data and review changes carefully. Settings, tax slabs, and coupon defaults are in `config.js`.

## Build, Test, and Development Commands

- `npm install` installs Express and body-parser.
- `npm start` runs `node server.js`; visit `http://localhost:3000`.
- `PORT=3001 npm start` starts the app on a different port for local checks.
- `npm test` currently exits with “no test specified.” Do not report it as a passing test until a real test runner is added.

There is no build step: edit the CommonJS source and refresh the browser or restart the server. Exercise changed endpoints with a browser or HTTP client; for example, `curl http://localhost:3000/api/orders`.

## Coding Style & Naming Conventions

Match the existing ES5/CommonJS style: `var`, `require(...)`, `module.exports`, semicolons, and two-space indentation. Use lowercase, singular route filenames and lowercase library filenames (for example, `routes/orders.js` and `lib/inventory.js`). Name exported helpers with verbs such as `get`, `list`, `computeTotals`, or `release`. Route handlers should validate input, use JSON errors, and keep domain calculations in `lib/` rather than duplicating them in routes.

## Testing Guidelines

No test directory or framework exists yet. When changing pricing, tax, stock, cancellation, or khata behavior, manually cover both success and failure cases, then verify the affected records in `data/db.json`. New automated tests should live in a new `test/` directory, use descriptive `*.test.js` names (for example, `test/inventory.test.js`), and add the runner to `package.json` before relying on `npm test`.

## Commit & Pull Request Guidelines

Recent history uses concise, feature-focused summaries such as `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`. Keep commits similarly scoped and lowercase; explain behavior changes in the body when needed. Pull requests should describe the user-visible/API impact, list manual verification, note `data/db.json` migrations or fixture changes, link relevant issues, and include screenshots for changes under `public/`.

## Configuration & Data Safety

Do not place real credentials in `config.js`; its admin key and shop details are development values. Preserve existing data shape and audit entries when modifying storage flows, and avoid committing accidental transactional changes from local testing.
