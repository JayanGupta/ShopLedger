# Repository Guidelines

## Project Structure

- `server.js` serves the browser UI, mounts the Express routers under `/api`, and handles printable invoices at `/orders/:id/invoice`.
- `routes/` handles HTTP requests. Put reusable business rules in `lib/`, which holds pricing, GST, coupons, inventory, Khata, invoices, reports, and JSON persistence.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` make up the browser UI. See `docs/architecture.svg` for the order placement flow.
- `config.js` holds shop settings, GST rates, and coupon rules. `data/db.json` stores products, orders, stock, credit balances, settlements, and audit entries.

## Local Development

- `npm install` installs Express and body-parser.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or use the port set by `PORT`. There is no build step.
- `npm test` is a placeholder that exits with an error. The repository has no configured test framework, coverage target, linter, or formatter.
- Use a disposable checkout or a copy of the database for tests that place orders, cancel orders, or record settlements. These actions rewrite `data/db.json`.

## Coding Style

Match the surrounding code: two-space indentation, single quotes, semicolons, CommonJS modules, and camelCase function and variable names. Keep HTTP handling in routers and business rules in the libraries. Reuse the existing pricing and tax helpers when changing checkout behavior.

## Testing Changes

Record the cases you verified and their expected results. For billing changes, compare the POS preview, saved order, and printable invoice using a mixed-GST cart and a capped coupon. For inventory or Khata changes, verify stock, customer balances, and cancellation effects against the saved records.

## Commits and Pull Requests

Use short, lowercase subjects that describe the change, as in `invoice page for accountant`. In the PR, describe the behavior change, link the ticket when available, and list verification steps. Include screenshots for visible POS or invoice changes. Keep test orders, customer data, and credentials out of the diff.
