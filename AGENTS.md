# Repository Guidelines

## Project Structure

ShopLedger is a Node.js and Express point of sale, Khata credit ledger, and GST invoicing app. `server.js` serves the browser assets in `public/`, mounts the routers in `routes/` under `/api`, and serves printable invoices. Keep HTTP handling in the routers and business logic in `lib/`. `config.js` holds shop settings, GST rates, and coupon rules. `data/db.json` is the application datastore for stock, orders, customers, settlements, and audit entries. See `docs/architecture.svg` for the order flow.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to use another port.
- `npm test` is a placeholder that exits with status 1. The browser assets are served directly and require no build step.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Match the surrounding CommonJS style with `require()`, `module.exports`, and `exports`. Use lower-case module filenames and descriptive camelCase functions such as `computeTotals`. No lint or format command is configured. Reuse existing helpers for pricing, stock, and ledger changes.

## Testing

The repository has no automated test suite, test naming convention, or coverage threshold. Verify changes manually in a local checkout with disposable data because orders and settlements rewrite `data/db.json`. For pricing changes, compare the cart preview, saved order, and printable invoice using mixed GST slabs and a capped coupon. For order or ledger changes, check stock and Khata balances after placement and cancellation.

## Commits and Pull Requests

Recent commits use short, mostly lowercase subjects without a required prefix, for example `support hsn gst slabs and coupon maxDiscount caps`. Use a similarly specific subject. In pull requests, describe the behavior change, record manual verification, and link the issue when one exists. Include screenshots for visible UI or invoice changes. Keep customer records and export credentials out of PR examples.
