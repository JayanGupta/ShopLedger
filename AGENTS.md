# Repository Guidelines

## Project Structure

ShopLedger is an Express point-of-sale app with inventory, Khata customer credit, and printable GST invoices.

- `server.js` serves the browser UI, mounts the API under `/api`, and handles printable invoices.
- `routes/` contains HTTP handlers for products, orders, customers, and reports. Put reusable business rules in `lib/`.
- `public/` contains plain HTML, CSS, and browser JavaScript. `config.js` holds shop settings, HSN GST slabs, and coupon rules.
- `data/db.json` is the app's writable store for stock, orders, credit balances, settlements, and audit entries. See [the architecture diagram](docs/architecture.svg) for the order flow.

## Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` starts Express at `http://localhost:3000` by default. Set `PORT` to override the port. The browser assets require no build step.
- `node --check routes/orders.js` checks JavaScript syntax without starting the app. Substitute the file you changed.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Match nearby code with CommonJS imports and exports on the server, camelCase function names such as `computeTotals`, and lowercase module names such as `pricing.js`. Keep the browser code framework-free and avoid unrelated reformatting. The repository has no configured linter or formatter.

## Testing

There is no automated test suite or coverage target. `npm test` is a placeholder that exits with an error. Use a disposable checkout or copy for manual checks that write to `data/db.json`. For pricing changes, place an order with mixed GST slabs and a coupon, then compare the checkout preview, saved order, printable invoice, and GST reconciliation report. For inventory or Khata changes, check stock and balances before and after placing and cancelling an order.

## Commits and Pull Requests

Follow the history's short, plain-language subjects, such as `support hsn gst slabs and coupon maxDiscount caps`. In the PR, describe the behavior change and how you verified it. Link a related issue when available and include screenshots for visible UI or invoice changes. Call out changes to stored data or billing calculations. Never stage or unstage Git changes.
