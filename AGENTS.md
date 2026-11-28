# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves the browser UI, mounts the `/api` routers, and handles printable invoices.
- `routes/` handles HTTP requests. `lib/` contains order, inventory, Khata credit, pricing, GST, coupon, reporting, invoice, and storage logic.
- `public/` contains plain HTML, CSS, and browser JavaScript. `config.js` holds shop settings and billing rules. `data/db.json` is the writable JSON store. See `docs/architecture.svg` for the order flow.

## Local Development

Run commands from the repository root.

- `npm install --ignore-scripts` installs the dependencies from `package.json`. The repository currently has no lockfile.
- `npm start` runs the app on port 3000 by default. Use `PORT=3001 npm start` to change it. The app serves the UI directly and has no build step.
- `node --check lib/pricing.js` checks a JavaScript file's syntax without starting the app. Substitute the path of any changed JavaScript file.

## Coding Style

Match surrounding code with two-space indentation, single quotes, semicolons, and camelCase names such as `computeTotals`. Server-side code uses CommonJS (`require`, `module.exports`, and `exports`). Keep business logic in `lib/` and request handling in `routes/`. No linter or formatter is configured.

## Testing

There is no configured test framework or coverage threshold. `npm test` is a placeholder that exits with an error. Use a disposable checkout with synthetic data for manual checks because placing orders and recording settlements rewrite `data/db.json`. For billing changes, compare the cart preview, saved totals, printable invoice, and reconciliation report. Cover applicable GST slabs, coupon caps, and rounding.

## Commits and Pull Requests

Recent commits use short, lowercase descriptions such as `invoice page for accountant`. In a pull request, describe the behavior change and how you verified it. Link the issue when one exists and include screenshots for UI or invoice layout changes.

## Data and Configuration

Keep real customer records and credentials out of commits. Use a private development environment because the app has no built-in authentication for its business routes.
