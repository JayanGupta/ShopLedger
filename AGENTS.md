# Repository Guidelines

## Project Structure

ShopLedger is a Node.js and Express point-of-sale app with a Khata credit ledger and printable GST invoices.

- `server.js` serves the browser UI, mounts the `/api` routers, and handles printable invoices at `/orders/:id/invoice`.
- `routes/` contains the product, order, customer, and report handlers. Keep HTTP request and response handling here and put reusable business logic in `lib/`.
- `public/` contains static HTML, CSS, and browser JavaScript. `config.js` holds shop settings, GST slabs, and coupon rules.
- `data/db.json` is the writable datastore. Use `lib/store.js` for persistence. See `docs/architecture.svg` for the order flow.

## Local Development

- `npm install` installs the Express and body-parser dependencies.
- `npm start` runs `node server.js`. Open `http://localhost:3000`, or use `PORT=3001 npm start` to select another port.

The app serves static assets directly and has no build step. Use disposable local data when exercising order placement, cancellation, or settlements because those operations modify `data/db.json`.

## Coding Style

Match nearby JavaScript. Use two-space indentation, single quotes, semicolons, and descriptive camelCase names such as `computeTotals`. Server modules use CommonJS (`require`, `exports`, and `module.exports`). Browser code uses plain JavaScript and DOM APIs. The repository has no configured formatter or linter. Keep GST, coupon, and rounding changes focused and check their effects on both checkout and invoice figures.

## Testing

`npm test` is a placeholder that exits with an error. There is no configured test framework, coverage threshold, or test naming convention. For pricing changes, manually verify a cart with mixed GST slabs and a capped coupon, then compare the checkout total, saved order, printable invoice, and reconciliation report. For inventory or ledger changes, verify the stock and balance before and after the affected operation.

## Commits and Pull Requests

Recent commits use short, lowercase subjects that name the change, for example `support hsn gst slabs and coupon maxDiscount caps`. In pull requests, summarize the behavior change and list the checks you ran. Link the relevant issue when available and include screenshots for visible UI or invoice changes.
