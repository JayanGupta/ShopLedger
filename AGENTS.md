# Repository Guidelines

## Project Structure

ShopLedger is a Node.js and Express point of sale with inventory, Khata credit, and printable GST invoices.

- `server.js` serves the browser UI, mounts the API under `/api`, and serves invoice HTML at `/orders/:id/invoice`.
- `routes/` contains HTTP handlers for products, orders, customers, and reports. `lib/` contains pricing, tax, coupons, inventory, credit, invoice rendering, and JSON persistence.
- `public/` contains the HTML, CSS, and browser JavaScript. `config.js` holds shop details, GST rates, coupon rules, and the default port.
- `data/db.json` is writable application state. See `docs/architecture.svg` for the order flow and module map.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to use another port.
- There is no build step. Express serves the files in `public/` directly.

## Coding Style

Use two-space indentation, single quotes, and semicolons to match the existing JavaScript. Use CommonJS (`require`, `exports`, and `module.exports`) on the server, lower camel case for identifiers such as `computeTotals`, and lowercase module filenames. Keep request handling in `routes/` and reusable business rules in `lib/`. No linter or formatter is configured.

## Testing

`npm test` is a placeholder that exits with an error. There is no configured test framework, naming convention, or coverage threshold. Use a throwaway checkout for manual checks that place or cancel orders or record settlements, since those actions rewrite `data/db.json`. For pricing changes, compare the cart preview, saved order, and printable invoice using mixed GST slabs and a capped coupon. Record the expected and observed amounts.

## Commits and Pull Requests

Git history uses short, descriptive, mostly lowercase subjects, such as `express routes for products and orders`. Keep commits focused. In pull requests, describe the behavior change and verification steps, link the related issue when available, and attach screenshots for UI or invoice layout changes. Keep real customer data and local transaction changes out of commits.
