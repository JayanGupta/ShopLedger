# Repository Guidelines

## Project Structure

ShopLedger is a Node.js and Express app for point-of-sale billing, inventory, Khata credit, and printable GST invoices. `server.js` serves the browser UI, mounts the API under `/api`, and handles the printable invoice route. `routes/` contains HTTP handlers for products, orders, customers, and reports. Put business rules in the corresponding module under `lib/` and keep HTTP handling in the router. Browser assets live in `public/` as plain HTML, CSS, and JavaScript. `config.js` holds shop and pricing settings, and `lib/store.js` persists state in the tracked `data/db.json` file.

## Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` unless you set `PORT`.
- `npm test` runs a placeholder that exits with status 1. There is no build script.

## Coding Style

Match nearby JavaScript. Use two-space indentation, single quotes, semicolons, and camelCase identifiers such as `computeTotals`. Server modules use CommonJS (`require`, `exports`, and `module.exports`). Keep style changes scoped to the code you touch. The repository has no configured formatter or linter.

## Testing Changes

The repo has no test framework, test naming convention, or coverage threshold. Use a disposable checkout for checks that place orders, cancel orders, or record settlements because those operations overwrite `data/db.json`. For pricing changes, compare the cart preview, saved order totals, and printable invoice using mixed GST slabs and a capped coupon. For order changes, check stock and Khata balances before and after placement and cancellation.

## Commits and Pull Requests

Git history uses short, lowercase subject lines that name the change, such as `support hsn gst slabs and coupon maxDiscount caps`. In a pull request, describe the behavior change and how you verified it. Link the related issue when available and include screenshots for visible UI or invoice changes. Keep incidental changes to `data/db.json` out of the diff.
