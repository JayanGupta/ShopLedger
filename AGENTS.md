# Repository Guidelines

## Project structure

`server.js` starts Express, mounts the routers under `/api`, serves `public/`, and handles the printable invoice at `/orders/:id/invoice`. Keep HTTP request handling in `routes/` and business rules in `lib/`. For example, `routes/orders.js` coordinates checkout, while `lib/pricing.js` calculates totals and `lib/ledger.js` updates Khata balances.

The browser UI uses `public/index.html`, `public/js/app.js`, and `public/css/style.css`. Shop details, HSN slabs, and coupon rules live in `config.js`. See [the architecture diagram](docs/architecture.svg) for the order flow.

## Local development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000`, or set `PORT` to use another port.
- Express serves the browser assets directly. There is no build step.

## Coding style

Match the surrounding JavaScript with two-space indentation, single-quoted strings, and semicolons. Server modules use CommonJS (`require`, `exports`, and `module.exports`). Use lowercase filenames such as `inventory.js` and camelCase function names such as `getSellableStock`. The repository has no configured formatter or linter.

## Testing and data handling

`npm test` is a placeholder that exits with status 1. There is no automated suite, test directory, test naming convention, or coverage threshold.

Use a disposable working copy for checkout, cancellation, and repayment checks. These actions rewrite `data/db.json`, which holds inventory, customer balances, orders, settlements, and audit entries. Keep manual test transactions out of commits.

For pricing changes, compare the cart preview, saved order, and printable invoice. Checkout and print use separate calculations. Order **#1004** is a useful existing case because its 5% GST slab and capped `SAVE10` discount exercise both differences.

## Commits and pull requests

Follow the history’s short, descriptive commit subjects, such as `invoice page for accountant`. In a pull request, describe the affected workflow and how you checked it. Link a related issue when available. For billing changes, include the expected and observed amounts. For visible UI changes, include a screenshot when it helps the reviewer verify the result.
