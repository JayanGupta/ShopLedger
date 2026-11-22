# Repository Guidelines

## Project Structure & Module Organization

- `server.js` bootstraps the Express app; `config.js` holds shop, tax, coupon, and inventory settings.
- `routes/` contains resource-oriented HTTP handlers. Keep request parsing and response handling here.
- `lib/` contains pricing, tax, coupon, inventory, order, ledger, reporting, date, invoice, and JSON-store logic. Put reusable business rules here.
- `public/` contains the HTML, CSS, and browser JavaScript UI. `data/db.json` is the file-backed store; `docs/architecture.svg` maps the modules and order flow.
- There is no test directory or test framework configured currently.

## Build, Test, and Development Commands

- `npm start` runs `node server.js`; the app listens on `PORT` or port 3000.
- `npm test` is a placeholder that prints “Error: no test specified” and exits with status 1. It does not run tests.
- No build or lint script is defined in `package.json`.

## Coding Style & Naming Conventions

Use the existing CommonJS style (`require` and `module.exports`/`exports`), two-space indentation, semicolons, and single-quoted JavaScript strings. Use camelCase for functions and variables. Keep route files named for their resource (for example, `routes/orders.js`) and put reusable behavior in `lib/`. Follow existing callback patterns unless a change updates the surrounding code consistently.

## Testing Guidelines

When adding tests, cover pricing, GST, coupons, inventory, and ledger behavior, then add a test runner and script to `package.json`. Include route-level checks for changes to request validation or persistence. There is no current coverage threshold or test command that can verify changes.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase descriptive subjects without a type prefix, such as `invoice page for accountant`. Follow that pattern. A pull request should explain the behavior change, list manual checks, include screenshots for UI changes, and call out any impact to `data/db.json` or stored order formats. Link an issue when one exists.

## Security & Data Handling

Do not commit production secrets; the admin key currently lives in `config.js`. Treat `data/db.json` as sensitive because it contains customer and sales records. Avoid replacing it with fixtures or including real customer data in changes.
