# Issue Log

## Open

- **Automated coverage:** `npm test` is currently a placeholder. Add a test runner and coverage for order placement/cancellation, inventory boundaries, settlement validation, invoice reconciliation, and date filters.
- **Persistence safety:** `lib/store.js` uses synchronous whole-file reads and writes without atomic replacement or concurrency protection. Concurrent requests can overwrite one another; consider a transactional database as usage grows.
- **Admin export security:** Export access now requires `ADMIN_KEY`, but authentication is still a query-string secret and there is no rate limiting or user-level authorization. Use authenticated admin access before exposing this endpoint beyond a trusted local network.
- **Environment setup:** Configure and document `ADMIN_KEY` for deployments that need `/api/admin/export`; without it, export correctly returns 403.
- **Historical invoice stability:** Invoice reconciliation recalculates using current tax and coupon configuration. Persisted line-level tax/discount details or a pricing-rule version would protect old invoices if configuration changes later.

## Resolved in 2026-11-21 change set

- Cancelled orders did not restore physical stock because the release path used a mismatched item identifier and updated reservations instead of stock.
- Duplicate product lines could bypass the per-line stock check, and selling exactly all sellable units was rejected.
- Invalid order quantities were silently coerced to one.
- String settlement amounts could concatenate into customer ledger totals.
- Invoice calculations could diverge from order totals by applying different GST and coupon rules.
- Order date filters and sorting compared display-formatted dates lexicographically.
- Admin export used a committed default key.
