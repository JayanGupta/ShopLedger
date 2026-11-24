# Repository Guidelines

## Project Structure & Module Organization

This repository is a Node.js/Express POS, inventory, Khata ledger, and invoicing app. `server.js` configures Express and mounts the routers. HTTP handlers live in `routes/`; reusable business logic lives in `lib/` (pricing, tax, coupons, inventory, ledger, orders, persistence, reports, and invoice rendering). The browser UI and assets are under `public/` (`index.html`, `js/`, `css/`). `config.js` holds shop and tax/coupon settings. `data/db.json` is the application’s local persistent store. `docs/architecture.svg` diagrams the current architecture. There is no dedicated test directory.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`; open `http://localhost:3000` unless `PORT` is set.
- No build or lint command is configured. `npm test` is a placeholder that deliberately exits with an error; do not treat it as a passing test suite.

## Coding Style & Naming Conventions

Follow the existing CommonJS style (`require`, `module.exports`) and four-space indentation. Use lowercase, descriptive filenames such as `pricing.js`; exported functions use camelCase (`computeTotals`). Route handlers should keep HTTP concerns in `routes/` and delegate calculations or state changes to `lib/`. Keep currency rounding consistent with existing `round2` helpers. There is no formatter or linter configuration, so keep changes focused and match surrounding style.

## Testing Guidelines

No test framework, test files, or coverage requirement is present. For changes, manually verify the affected behavior in a development copy and compare API results with persisted order/ledger data. Do not use the live `data/db.json` for experiments; back it up before any manual run that writes data. Add automated tests when introducing a test framework, covering at least order totals, GST slabs, coupons, inventory updates, Khata, and invoice reconciliation.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`); follow that style. PRs should explain the user-visible change, list affected routes/modules, include reproduction or verification steps, and attach screenshots for UI changes. Call out changes to tax, coupon, inventory, or ledger behavior explicitly.

## Security & Configuration

Do not commit real customer or transaction data. Treat `data/db.json` as sensitive and keep secrets out of source control; review `config.js` before exposing admin or shop endpoints beyond a trusted local environment.
