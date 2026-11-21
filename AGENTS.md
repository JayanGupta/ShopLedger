# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves the browser UI, mounts the API under `/api`, and handles the printable invoice URL.
- `routes/` contains the product, order, customer, and report endpoints. `lib/` contains business logic and persistence. `config.js` holds the port, shop details, GST slabs, and coupon rules.
- `public/` contains the HTML, CSS, and browser JavaScript. See `docs/architecture.svg` for the module map and order flow.
- `data/db.json` is both the checked-in sample data and the running app's writable store. Use a disposable checkout for tests that create orders or settlements.

## Development Commands

- `npm install` installs the Express and body-parser dependencies.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to use a different port. The browser assets are served directly from `public/`.
- `npm test` currently prints a placeholder message and exits with status 1. Use the manual checks below for verification.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Follow existing CommonJS conventions on the server with `require()` and `exports`. Use lowercase module filenames such as `pricing.js` and camelCase function names such as `computeTotals()`. Keep HTTP handling in `routes/`, business logic in `lib/`, and JSON file access in `lib/store.js`. Formatting follows the surrounding code.

## Testing Guidelines

Verification is currently manual. For pricing changes, place an order with mixed GST slabs and a capped coupon. Compare the cart preview, saved order, printable invoice, and GST reconciliation report. Checkout and invoice use separate calculations, so record the expected figures for each. For stock or Khata changes, check the stored quantities and customer balance after placing and cancelling an order. Check `git status --short` for incidental changes to `data/db.json` before committing.

## Commits and Pull Requests

Use short, descriptive commit subjects in the style of the existing history, for example `support hsn gst slabs and coupon maxDiscount caps`. In the PR, explain the behavior change and list the manual checks and their results. Link the ticket when available and include a screenshot for visible POS or invoice changes.
