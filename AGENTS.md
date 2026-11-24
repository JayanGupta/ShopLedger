# Repository Guidelines

## Project Structure

- `server.js` wires up Express, serves the browser UI, mounts the routers under `/api`, and handles `GET /orders/:id/invoice`.
- `routes/` handles HTTP requests. `lib/` owns pricing, GST, coupons, inventory, orders, Khata, reporting, invoice rendering, and JSON persistence.
- `public/` contains plain HTML, CSS, and browser JavaScript. `config.js` holds shop details and business settings. `data/db.json` stores products, orders, customers, settlements, and the audit log.

## Local Development

- `npm install` installs dependencies. Use `npm ci` when a matching lockfile is available and you need a clean, reproducible install.
- `npm start` runs `node server.js`. Open `http://localhost:3000` unless you set `PORT`.
- `npm test` currently exits with a placeholder error. The project defines no build or lint script.

## Coding Style

Match nearby JavaScript. Backend modules use CommonJS, two-space indentation, single quotes, semicolons, and camelCase names such as `computeTotals`. Keep HTTP parsing and responses in routes and reusable business logic in `lib/`. Follow existing filenames such as `routes/orders.js` and `lib/pricing.js`. The repository has no configured formatter.

## Testing and Data Handling

There is no test framework, naming convention, or coverage threshold. Use `node --check routes/orders.js` for a syntax check, substituting the file you changed. Run write-path checks in a disposable checkout because the server rewrites `data/db.json`. Keep customer records, local transactions, and export credentials out of patches and screenshots.

For pricing changes, compare cart preview, the saved order, and the printable invoice using mixed HSN slabs and a capped coupon. Record expected and actual tax, discount, and total. For stock or Khata changes, verify both order placement and cancellation.

## Commits and Pull Requests

Use short, descriptive commit subjects. Existing commits use plain lowercase phrases, for example `customer khata credit ledger and order cancellation`. In pull requests, describe the behavior change and verification, link a relevant issue when available, and include screenshots for UI or printable invoice changes.
