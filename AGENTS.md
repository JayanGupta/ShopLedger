# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves the browser UI, mounts the API under `/api`, and serves printable invoices at `/orders/:id/invoice`.
- `routes/` contains HTTP handlers for products, orders, customers, and reports. Keep request handling there and put reusable business rules in `lib/`.
- `public/` contains the HTML, CSS, and vanilla browser JavaScript. See [the architecture diagram](docs/architecture.svg) for the module map and order flow.
- `config.js` holds shop settings, GST slabs, and coupons. `data/db.json` is the writable store for stock, orders, Khata balances, settlements, and audit entries.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` by default or set `PORT` to use a different port.
- `npm test` is a placeholder that exits with status 1. The app serves its static assets directly and has no build script.

## Coding Style

Match the surrounding code. Use two-space indentation, single-quoted JavaScript strings, and camelCase names such as `computeTotals`. Server modules use CommonJS (`require` and `exports)). The project has no configured lint or format script.

## Testing

The repository has no configured test framework, test file naming convention, or coverage threshold. Use a disposable copy of the data for checks that place orders, cancel orders, or record settlements. For pricing changes, compare the cart preview, saved order, and printable invoice using mixed GST slabs and a capped coupon. For stock or Khata changes, check the saved quantities and balances before and after cancellation.

## Commits and Pull Requests

Use short, descriptive commit subjects. The Git history uses lowercase summaries such as “support hsn gst slabs and coupon maxDiscount caps”. In a pull request, explain the behavior change, link the issue if one exists, and record the checks you ran. Include screenshots for visible POS or invoice changes and call out any effect on existing orders or stored data.
