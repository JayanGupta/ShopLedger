# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and body-parser 1. The frontend uses plain HTML, CSS, and JavaScript. The app persists its data in `data/db.json`.

## Module map

- `server.js` serves the frontend, mounts the API routers, and exposes the printable invoice route. `config.js` holds application settings.
- `public/` contains the point-of-sale, order history, Khata, and audit UI.
- `routes/` contains the products, orders, customers, and reports routers. The reports router also handles pricing preview and data export.
- `lib/` contains order and date handling, inventory, Khata accounting, pricing, coupons, GST, invoice rendering, reporting, and JSON persistence.
- `data/db.json` stores the catalog, orders, customers, settlements, ID counters, and audit entries.

## Commands

| Command | Current behavior |
| --- | --- |
| `npm start` | Runs `node server.js`. The default port is 3000, and `PORT` can override it. |
| `npm test` | Runs a placeholder that prints an error and exits with status 1. |

## Rules

- Write characterization tests that capture existing behavior before changing it.
- Change only the module the ticket is about.
- Tests must never read or write `data/db.json`. Use isolated fixtures or temporary data.
- Add no dependencies.
