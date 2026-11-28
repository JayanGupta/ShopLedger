# Repository Guidelines

## Project Structure

This is a small CommonJS Node/Express app. `server.js` mounts the API routers in `routes/` and serves the browser UI from `public/` (`index.html`, `js/app.js`, and `css/style.css`). Business logic lives in `lib/` (pricing, tax, coupons, inventory, orders, ledger, invoices, reports, dates, and storage). `config.js` holds shop settings and defaults. `data/db.json` is the local JSON database; `docs/architecture.svg` diagrams the app and checkout flow. There is no test directory currently.

## Development Commands

- `npm start` — start the local server on port 3000, or the value of `PORT`.
- `npm test` — currently a placeholder that exits with an error; no build or lint command is configured.

## Style and Organization

Follow the existing JavaScript style: two-space indentation, CommonJS `require`/`module.exports`, `var`, single-quoted strings, and semicolons. Use camelCase for functions and variables; keep route handlers in the matching `routes/*.js` file and reusable logic in `lib/*.js`. There is no formatter or linter configuration, so keep changes consistent with nearby code.

## Testing

No test framework, coverage target, or working test command is defined. For behavior changes, add focused tests (use `*.test.js`) and wire the chosen test runner into `package.json`; cover pricing, GST, stock, and Khata edge cases when relevant. Until then, describe any manual checks in the pull request.

## Commits and Pull Requests

Recent history uses short, lowercase summaries without a prefix, for example `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`. Keep subjects similarly concise. A pull request should explain the behavior change, list checks performed, link its issue when applicable, and include a screenshot for UI changes. Call out changes to `data/db.json` or tax/pricing behavior explicitly.

## Data and Agent Notes

`data/db.json` contains customer and transaction records; do not add real credentials or unnecessary personal data. `config.js` currently contains a hard-coded admin key, so treat it as sensitive and avoid copying it into examples. When the user types `/graphify`, read and follow the installed graphify skill before other work.
