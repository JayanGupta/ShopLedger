# Repository Guidelines

## Project Structure

- `server.js` configures Express, mounts `routes/` under `/api`, and serves printable invoices at `/orders/:id/invoice`.
- `lib/` contains pricing, GST, coupons, inventory, orders, Khata, reporting, and JSON persistence. The browser UI lives in `public/`, with JavaScript in `public/js/app.js` and styles in `public/css/style.css`.
- `config.js` holds shop settings, HSN rates, and coupon rules. `data/db.json` is the app's writable store. See [the architecture diagram](docs/architecture.svg) for the order flow.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` unless you set `PORT`. There is no build step.
- `npm test` runs a placeholder that exits with an error. The repository has no configured test framework or coverage threshold.

## Coding Style

Use two-space indentation, single-quoted strings, and semicolons in JavaScript. Match the surrounding CommonJS style with `require()` and `exports` or `module.exports`. Use lowercase module filenames and camelCase function names, such as `computeTotals()`. The repository has no configured formatter or linter.

## Verification and Data Handling

Run manual checks against a disposable copy of the app and its JSON data. For checkout changes, verify the preview, saved order total, and printed invoice with a mixed-HSN cart and a coupon. For inventory or Khata changes, check stock and balances after placing and cancelling an order, and after recording a settlement. Keep local test transactions and customer data out of commits.

## Commits and Pull Requests

Follow the short, lowercase subjects used in Git history, such as “invoice page for accountant.” In the PR description, explain the behavior change, list the checks you ran, and link the relevant issue if one exists. Include a screenshot for visible POS or invoice changes and call out any changes to persisted order fields.
