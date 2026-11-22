# Repository Guidelines

## Project Structure

ShopLedger is a Node.js and Express point of sale with a Khata credit ledger and printable GST invoices. `server.js` serves the browser UI from `public/`, mounts the routers under `/api`, and handles `GET /orders/:id/invoice`. Keep HTTP handling in `routes/` and business rules in `lib/`. The UI uses plain HTML, CSS, and JavaScript. `config.js` defines shop settings, GST slabs, and coupon rules. `lib/store.js` reads and rewrites `data/db.json`.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `server.js`. Open `http://localhost:3000` or set `PORT` to use a different port. The browser assets require no build step.
- `node --check lib/pricing.js` checks JavaScript syntax without starting the app. Substitute the file you changed.

## Coding Style

Use two-space indentation, single quotes for JavaScript strings, and semicolons. Follow the existing CommonJS style with `require()`, `module.exports`, or `exports`. Use camelCase for functions and variables, and short lowercase filenames such as `pricing.js`. Follow the surrounding code when editing existing modules. The repository has no configured formatter or linter.

## Testing and Data

`npm test` is a placeholder that exits with an error. The repository has no configured test framework, coverage threshold, or test naming convention. Use an isolated checkout with disposable data for manual checks because placing orders, cancelling orders, and recording settlements write to `data/db.json`.

For billing changes, check the cart preview, saved order, printable invoice, and GST reconciliation. Include mixed GST slabs and a capped coupon, and record expected figures. For stock or Khata changes, check balances and stock before and after placing and cancelling an order. Keep real customer data and credentials out of commits and screenshots.

## Commits and Pull Requests

Use short, descriptive commit subjects. Recent history uses lowercase subjects without a prefix, such as “invoice page for accountant.” In a pull request, describe the behavior change and how you verified it. Link the relevant issue when available and include screenshots for visible UI or print-layout changes.
