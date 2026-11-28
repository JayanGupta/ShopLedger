# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express point-of-sale, inventory, Khata ledger, and GST invoicing app. `server.js` mounts the API and serves the browser app. `routes/` contains Express route handlers; `lib/` contains pricing, tax, coupons, inventory, orders, ledger, reports, invoice, date, and JSON-store logic. `config.js` holds shop settings and business rules. `public/` contains `index.html`, `js/app.js`, and `css/style.css`. `data/db.json` is the app’s local data store. `docs/` contains project documentation. There is no separate test directory in the repository.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app on port 3000 by default (`PORT` can override it).
- `npm test` is currently a placeholder that exits with an error; no test framework or build script is configured.

Do not treat a successful dependency installation as a test. For changes, inspect the affected route and library paths and verify relevant behavior manually in a suitable development environment.

## Coding Style & Naming Conventions

Use the existing CommonJS style (`require`, `module.exports`/`exports`) and straightforward JavaScript consistent with the surrounding files. Existing code uses two-space indentation, semicolons, `camelCase` for functions and variables, and lowercase filenames such as `pricing.js` and `orders.js`. Keep route handlers focused on request/response handling and place reusable business logic in `lib/`. No formatter or linter is configured.

## Testing Guidelines

There are no discovered automated tests, coverage settings, or test naming rules. If adding tests, first choose and document a framework and wire it into `package.json`; keep test files clearly named (for example, `pricing.test.js`). Pay particular attention to checkout totals, coupon limits, HSN GST slabs, stock reservation/release, Khata balance updates, and invoice reconciliation.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase, descriptive subjects (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that pattern and describe the behavior changed. Pull requests should explain the user-visible change, list relevant routes/modules, include manual or automated verification details, and add screenshots for browser UI changes. Call out any changes to `data/db.json` shape or business rules.

## Security & Data Notes

`data/db.json` is written directly by the app; preserve existing data and avoid committing real customer or transaction information. Keep secrets out of source control; review `config.js` before deploying because it contains operational settings and a configured admin key.
