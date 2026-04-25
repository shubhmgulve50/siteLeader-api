# UI (REST API Surface) — siteLeader-api

This project is a backend API. This file documents the REST API surface — routes, request shapes, and response contracts — instead of UI components.

---

## API base path

All routes are prefixed with `/api` (mounted in `routes/index.js`).

---

## Auth routes (`/api/auth`)

| Method | Path | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/login` | No | — | Authenticate user, return JWT tokens |
| POST | `/logout` | No | — | Clear session cookies |
| POST | `/register` | Yes | SUPER_ADMIN, BUILDER | Create new user |

**Login request:**
```json
{ "email": "user@example.com", "password": "password123" }
```
**Login response:**
```json
{ "success": true, "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }
```

---

## Site routes (`/api/sites`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List sites (builder-scoped) |
| GET | `/:id` | All | Get single site |
| POST | `/` | SUPER_ADMIN, BUILDER | Create site |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update site |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete site |
| GET | `/:siteId/stats` | All | Site stats (finance + labour + materials) |
| POST | `/assign-labour` | SUPER_ADMIN, BUILDER | Assign labour to site |
| GET | `/:siteId/labour` | All | List assigned labour for site |
| POST | `/attendance` | SUPER_ADMIN, BUILDER, SUPERVISOR | Mark attendance |
| GET | `/:siteId/attendance` | All | Get attendance records |
| GET | `/:siteId/attendance/summary` | All | Monthly payroll summary |
| POST | `/logs` | SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER | Create daily log (multipart; `images` file parts up to 10 → S3) |
| GET | `/:siteId/logs` | All | Get daily logs |

---

## Labour routes (`/api/labours`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List labours (builder-scoped) |
| POST | `/` | SUPER_ADMIN, BUILDER | Create labour |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update labour |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete labour |

---

## Material routes (`/api/materials`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List materials (builder-scoped) |
| POST | `/` | SUPER_ADMIN, BUILDER | Create material catalog entry |
| PUT | `/:id` | All | Update material |
| DELETE | `/:id` | All | Delete material |
| POST | `/log` | All (SUPERVISOR/ENGINEER: Out only) | Log stock movement. For `type=Out` auto-generates `issueSlipNumber` (`ISS-YY-NNNN`) and accepts `issuedTo`/`purpose`. For `type=In` accepts `vendorName`/`invoiceReference` |

Finance routes (`/api/finance`) now accept **multipart/form-data** with `receipts` file parts (up to 5, images/PDF) on both POST and PUT. PUT also accepts `removeReceipt` (string or array) to delete existing receipt URLs from S3. Response includes `receiptUrls: string[]`.

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List transactions + summary |
| POST | `/` | All | Create (multipart with `receipts`) |
| PUT | `/:id` | All | Update (multipart with `receipts` + optional `removeReceipt`) |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete (S3 receipts cleaned up best-effort) |
| GET | `/logs` | All | Get movement logs |
| GET | `/logs/:id` | All | Get single log (for issue-slip print) with populated material + site + createdBy |

---

## Finance routes (`/api/finance`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List transactions + summary |
| POST | `/` | All | Create transaction |
| PUT | `/:id` | All | Update transaction |
| DELETE | `/:id` | All | Delete transaction |

---

## Quotation routes (`/api/quotations`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List quotations |
| GET | `/:id` | All | Get single quotation (populated site) |
| POST | `/` | SUPER_ADMIN, BUILDER | Create quotation |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update / change status |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete quotation |

---

## Invoice routes (`/api/invoices`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List invoices |
| GET | `/:id` | All | Get invoice (populated site + quotation) |
| POST | `/` | SUPER_ADMIN, BUILDER | Create GST invoice; auto-num `INV-YYNNNN`; totals + payment status computed server-side |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update |
| POST | `/:id/payments` | SUPER_ADMIN, BUILDER | Record payment `{ amount }`; derives `paymentStatus` |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete |

---

## RA Bill routes (`/api/ra-bills`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List RA bills |
| GET | `/seed` | All | Seed items from quotation + auto-sum prior cum qty — query: `siteId` (required), `quotationId` (optional) |
| GET | `/:id` | All | Get RA bill (populated site + quotation) |
| POST | `/` | SUPER_ADMIN, BUILDER | Create; auto-num `RA-YY-NNN` + `raSequence` per site |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete |

---

## Labour advance routes (`/api/labour-advances`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List advances. Query: `labourId`, `siteId`, `from`, `to`. Returns `{ data, count, total }` |
| POST | `/` | SUPER_ADMIN, BUILDER, SUPERVISOR | Record advance `{ labourId, siteId?, amount, date, paymentMode, note }` |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete |

Attendance summary `/api/sites/:siteId/attendance/summary` now joins advance totals into each row as `advance` + `balance`.

---

## Admin routes (`/api/admin`)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/profile` | All | Get current user profile |
| GET | `/dashboard-stats` | All | Aggregated KPI stats |

---

## Standard response shapes

**Success:**
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "count": 10 }
{ "success": true, "data": [...], "summary": { "totalIncome": 5000, "totalExpense": 3000, "balance": 2000 } }
```

**Error:**
```json
{ "success": false, "message": "Validation error", "errorData": { ... } }
```

---

*Last updated: 2026-04-17*
