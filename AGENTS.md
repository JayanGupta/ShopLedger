# Repository Guidelines

## Project Structure & Module Organization

This is a small CommonJS Node/Express application. `server.js` mounts the API routers and serves the browser app in `public/` (`index.html`, `js/app.js`, `css/style.css`). HTTP handlers live in `routes/`; business logic is separated into `lib/` modules for pricing, tax, coupons, inventory, orders, Khata, invoices, reports, dates, and JSON storage. `config.js` holds shop settings and defaults. `data/db.json` is the local data store; treat it as operational data and avoid overwriting it during development. `docs/architecture.svg` diagrams the main components. No test directory is present.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app at `http://localhost:3000` by default (`PORT` can override the port).
- There is no build script or compilation step; the browser assets are served directly.
- `npm test` is only a placeholder that exits with an error (“no test specified”). Do not treat it as a passing test suite; add focused tests when introducing test infrastructure.

## Coding Style & Naming Conventions

Follow the existing JavaScript style: two-space indentation, CommonJS `require`/`module.exports`, and `camelCase` function and variable names. Route files are named for their resource (`orders.js`, `customers.js`); keep request handling in `routes/` and reusable business rules in `lib/`. Preserve the existing plain JavaScript approach unless a change specifically requires new tooling. No formatter or linter is configured.

## Testing Guidelines

There is currently no test framework, test directory, or coverage requirement. For changes to money, GST, coupons, stock, Khata, or persistence, include manual verification steps in the pull request and consider adding automated tests with the change. Do not claim `npm test` passed; it intentionally fails until configured.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive, lowercase subjects (for example, `support hsn gst slabs and coupon maxDiscount caps`); follow that style and describe the outcome. No pull request template or formal policy is present. Provide a concise summary, the affected routes/modules, manual checks performed, and screenshots for visible UI changes. Call out data migrations or changes to invoice totals explicitly.

## Security & Data Handling

Do not commit credentials or real customer data. `config.js` currently contains an admin key and shop details; keep secrets out of examples and move sensitive values to environment configuration when changing that area. Take care with `data/db.json`: `lib/store.js` rewrites the whole file on updates.
