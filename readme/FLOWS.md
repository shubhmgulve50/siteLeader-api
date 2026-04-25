# Flows — siteLeader-api

## 1. Authentication flow

### Purpose
Issue JWT access + refresh tokens; enforce session lifecycle.

### Steps
1. `POST /api/auth/login` with `{ email, password }`.
2. `auth.controller.js`: Joi validation via `validateRequest(authSchema)`.
3. `User.findOne({ email })` → compare password with `bcryptjs.compare`.
4. On match: `generateAccessToken(payload)` + `generateRefreshToken(payload)` from `utils/auth.js`.
5. Tokens set as HttpOnly cookies + returned in response body.
6. On logout: `POST /api/auth/logout` → clears cookies.

### Data Pathways
- Input: `{ email, password }`
- Output: `{ success: true, data: { user, accessToken, refreshToken } }`
- Tokens stored as cookies: `token` (access) + `refreshToken`

### Dependencies
- `utils/auth.js`, `utils/jwt.js`, `bcryptjs`, `jsonwebtoken`

---

## 2. Request authorisation flow

### Purpose
Enforce role-based access on every protected endpoint.

### Steps
1. `authMiddleware` extracts Bearer token from `Authorization` header or cookie.
2. `verifyToken(token, JWT_SECRET)` → decoded payload → `User.findById(id)`.
3. Attaches `req.user = user`.
4. `allowRoles(...roles)` checks `req.user.role` → `HttpError(403)` if not allowed.
5. `builderScope` injects `req.builderFilter`:
   - SUPER_ADMIN → `{}`
   - BUILDER → `{ builderId: req.user._id }`
   - Others → `{ builderId: req.user.builderId }`
6. Controller spreads `req.builderFilter` into every Mongoose query.

---

## 3. Site CRUD flow

### Purpose
Manage construction site records with multi-tenant isolation.

### Steps
1. `GET /api/sites` → `siteController.getAll` → `Site.find({ ...req.builderFilter })`.
2. `POST /api/sites` → validates body → `Site.create({ ...body, builderId })`.
3. `PUT /api/sites/:id` → validates ObjectId → `Site.findOneAndUpdate({ _id, ...builderFilter })`.
4. `DELETE /api/sites/:id` → `Site.findOneAndDelete({ _id, ...builderFilter })`.

### Data Pathways
- All queries include `builderFilter` to prevent cross-tenant access.

---

## 4. Labour attendance & payroll flow

### Purpose
Record daily attendance and calculate monthly wage summaries.

### Steps
1. `POST /api/sites/assign-labour` → `SiteLabour.create({ siteId, labourId, builderId })`.
   - Unique index on `siteId + labourId` prevents duplicate assignment.
2. `POST /api/sites/attendance` → `{ siteId, labourId, date, status }`:
   - `status`: `Present` | `Half Day` | `Absent`
   - Upserts via `Attendance.findOneAndUpdate({ siteId, labourId, date }, ..., { upsert: true })`.
   - Unique index on `siteId + labourId + date` enforced at DB level.
3. `GET /api/sites/:siteId/attendance/summary?month=YYYY-MM`:
   - Aggregation pipeline groups by labourId.
   - Counts Present (P), Half Day (HD), Absent (A).
   - Computes `totalDays` and `earnings = (P × dailyWage) + (HD × dailyWage × 0.5)`.
   - Joins `Labour` model for name + dailyWage.

### Data Pathways
- `Attendance` → `{ siteId, labourId, date, status, builderId }`
- Summary response: `[{ labour: { name, dailyWage }, P, HD, A, totalDays, earnings }]`

---

## 5. Material stock management flow

### Purpose
Track material inventory; log stock In/Out movements per site.

### Steps
1. `POST /api/materials` → create catalog entry with `openingStock` → sets `currentStock = openingStock`.
2. `POST /api/materials/log` → `{ materialId, type, quantity, siteId?, note? }`:
   - `type = In` → `Material.findByIdAndUpdate(id, { $inc: { currentStock: +qty } })`.
   - `type = Out` → decrements stock; validates `currentStock - qty >= 0`.
   - Creates `MaterialLog` document for audit trail.
   - SUPERVISOR/ENGINEER restricted to `type = Out` only (role check in controller).
3. `GET /api/materials/logs?siteId=id` → filtered log for site detail view.

### Data Pathways
- `MaterialLog`: `{ materialId, type, quantity, siteId, note, builderId, createdBy, createdAt }`

---

## 6. Quotation generation flow

### Purpose
Build itemised Indian-style BOQ quotations with optional section grouping, per-item rate analysis (material/labour/equipment/overhead), CGST/SGST/IGST split, discount, and sequential numbering.

### Steps
1. `POST /api/quotations` → body: `{ clientName, clientEmail?, clientAddress?, siteId, items[], gstType, cgstPercentage?, sgstPercentage?, igstPercentage?, taxPercentage?, discountAmount?, validUntil? }`:
   - `computeTotals()` iterates items → `processItem()` computes `rate` = sum(material + labour + equipment + other) if any breakdown > 0, else honours explicit `rate`. `amount = qty × rate`.
   - Subtotal = Σ amounts. Taxable = max(0, subTotal − discountAmount).
   - If `gstType === 'CGST_SGST'` → `cgstAmount = taxable × cgst%/100`, `sgstAmount = taxable × sgst%/100`, `taxAmount = cgst + sgst`.
   - If `gstType === 'IGST'` → `igstAmount = taxable × igst%/100`, `taxAmount = igst`.
   - Else → legacy `taxAmount = taxable × taxPercentage/100`.
   - `totalAmount = taxable + taxAmount`.
   - Count existing quotations for this builder: `Quotation.countDocuments({ builderId })`.
   - Generate number: `QT-${YY}${(count + 1).toString().padStart(4, '0')}` (e.g. `QT-260001`).
   - Calculate `subTotal = sum(item.qty × item.rate)`.
   - `totalAmount = subTotal + (subTotal × taxPercentage / 100)`.
   - Save with status `Draft`.
2. `PUT /api/quotations/:id` → update items or status (`Draft` → `Sent` → `Approved`).

### Data Pathways
- `Quotation`: `{ quotationNumber, clientName, clientAddress?, siteId, items[{ sectionTitle?, itemNumber?, description, quantity, unit, materialRate?, labourRate?, equipmentRate?, otherRate?, rate, amount, hsnCode?, notes? }], gstType, cgstPercentage?, sgstPercentage?, igstPercentage?, cgstAmount, sgstAmount, igstAmount, taxPercentage, taxAmount, discountAmount, subTotal, totalAmount, validUntil?, revisionNumber, status, builderId }`
- New items expose Indian-BOQ grouping via `sectionTitle` (flat list with section label per item — frontend groups on render).

---

## 7. Finance transaction flow

### Purpose
Record income and expense transactions with category breakdown.

### Steps
1. `GET /api/finance` → returns `{ data: Transaction[], summary: { totalIncome, totalExpense, balance } }`.
   - Summary computed via `aggregate` on Transaction model.
2. `POST /api/finance` → `{ type: 'Income'|'Expense', amount, category, siteId?, date, notes }`.
3. `PUT /api/finance/:id`, `DELETE /api/finance/:id` — standard CRUD with builder scope.

### Data Pathways
- Categories: Client Payment, Material Cost, Labour Wage, Fuel, Office Rent, Marketing, Other.

---

## 8. Daily log (DPR) flow

### Purpose
Track daily progress reports per site with optional photo attachments.

### Steps
1. `POST /api/sites/logs` — **multipart/form-data** (for optional image uploads):
   - Fields: `siteId` (required), `workDone` (required), `issues`, `date`, `images[]` (up to 10 files, JPG/PNG, processed by `upload.array('images', 10)` multer middleware).
   - Each file uploaded via `uploadFile(file, 'dailyLogs/<siteId>')` → CloudFront URLs.
   - URLs saved to `DailyLog.images[]`.
   - JSON callers without files are still supported — `images` body field may carry pre-uploaded URLs (string or array).
2. `GET /api/sites/:siteId/logs` → entries ordered by `date` desc; `createdBy` populated with `name`.

### Data Pathways
- Request (mobile/web): FormData — `siteId`, `workDone`, `issues?`, `images` (repeated file parts).
- Storage: `s3://<bucket>/dailyLogs/<siteId>/<timestamp>-<rand>.<ext>` → CloudFront URL.
- Response: `{ success: true, data: DailyLog }` with `images: string[]` URLs.

---

## 9. Dashboard stats flow

### Purpose
Aggregate KPI data across all resources for the dashboard.

### Steps
1. `GET /api/admin/dashboard-stats`:
   - `Site.countDocuments(builderFilter)` → total sites.
   - `Labour.countDocuments(builderFilter)` → total labour.
   - `Transaction.aggregate([{ $match: builderFilter }, { $group: { _id: '$type', total: { $sum: '$amount' } } }])` → income/expense totals.
   - `Quotation.aggregate(...)` → total pipeline value.
2. Returns combined object in single response.

---

## 10. GST Tax Invoice flow

### Purpose
Issue Indian GST-compliant tax invoices (CGST+SGST intra-state / IGST inter-state / none) with payment tracking.

### Models
- `models/invoice.model.js` — invoice document with `items[{ description, hsnCode, quantity, unit, rate, amount, notes }]`, party info (GSTIN, place-of-supply), GST (`gstType`, `cgstPercentage/sgstPercentage/igstPercentage`, corresponding amounts), `discountAmount`, `roundOff`, `totalAmount`, `paidAmount`, `paymentStatus` (UNPAID/PARTIAL/PAID/OVERDUE), `issueDate`, `dueDate`.

### Routes (`/api/invoices`)
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List invoices |
| GET | `/:id` | All | Fetch invoice |
| POST | `/` | SUPER_ADMIN, BUILDER | Create invoice |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update |
| POST | `/:id/payments` | SUPER_ADMIN, BUILDER | Record payment `{ amount }` |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete |

### computeTotals (server)
- `subTotal = Σ qty × rate`
- `taxableAmount = max(0, subTotal − discountAmount)`
- GST: if `CGST_SGST` → `cgstAmount/sgstAmount`; if `IGST` → `igstAmount`
- `taxAmount = cgst + sgst + igst`
- `totalAmount = round(taxableAmount + taxAmount)` with `roundOff` delta saved
- `paymentStatus` derived: `paid >= total` → PAID; `paid > 0 && paid < total` → PARTIAL; `due < today && paid < total` → OVERDUE; else UNPAID

### Invoice number
`INV-${YY}${(count+1).padStart(4,'0')}` — per builder.

---

## 11. Running Account (RA) Bill flow

### Purpose
Progress billing against a contract — tracks cumulative executed qty per BOQ item, subtracts previously billed, applies retention / mobilization recovery / security deposit / TDS + GST.

### Models
- `models/raBill.model.js` — fields: `raNumber` (unique, `RA-YY-NNN`), `raSequence` (per-site counter), `items[{ description, itemNumber, unit, contractQty, rate, previousCumulativeQty, cumulativeQty, currentQty, cumulativeAmount, previousAmount, currentAmount, hsnCode }]`, `cumulativeGrossValue`, `previouslyBilled`, `thisBillGross`, deductions (`retentionPercentage/retentionAmount`, `mobilizationAdjustment`, `securityDepositAmount`, `otherDeductions` + note), `taxableAmount`, GST (same shape as invoice), `tdsPercentage/tdsAmount`, `totalAmount`, `status` (DRAFT/SUBMITTED/CERTIFIED/PAID), `siteId`, `quotationId?`, `issueDate`, `periodFrom/periodTo`.

### Routes (`/api/ra-bills`)
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List |
| GET | `/seed?siteId=&quotationId=` | All | Seed items from quotation + previous cum qty from prior RAs |
| GET | `/:id` | All | Fetch |
| POST | `/` | SUPER_ADMIN, BUILDER | Create |
| PUT | `/:id` | SUPER_ADMIN, BUILDER | Update |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete |

### Seed endpoint
`GET /api/ra-bills/seed?siteId=&quotationId=`:
1. Loads quotation → copies items (description/unit/rate/itemNumber/hsnCode/contractQty).
2. Loads ALL prior `RaBill` docs for that site → for each seeded item, sums matching items' `cumulativeQty` across prior bills → sets `previousCumulativeQty`.
3. Returns `{ items, priorBillsCount }`. Frontend pre-fills the form — user only needs to enter this period's `cumulativeQty`.

### computeTotals (server)
- Per item: `currentQty = max(0, cumulativeQty − previousCumulativeQty)`, `cumulativeAmount/previousAmount/currentAmount = qty × rate`.
- `thisBillGross = Σ currentAmount`.
- `retentionAmount = thisBillGross × retentionPercentage/100`.
- `taxableAmount = max(0, thisBillGross − retention − mobilization − securityDeposit − otherDeductions)`.
- GST on taxable (CGST+SGST or IGST).
- `tdsAmount = (taxable + tax) × tdsPercentage/100`.
- `totalAmount = max(0, taxable + tax − tds)`.

### RA number
`RA-${YY}-${(count+1).padStart(3,'0')}`; `raSequence` is per-site count + 1.

---

## 12. Labour advance + payroll flow

### Purpose
Track wage advances paid to labour during the month. Used to compute `balance = earnings − advance` in the attendance summary.

### Models
- `models/labourAdvance.model.js`: `{ labourId, siteId?, amount, date, paymentMode (Cash/UPI/Bank/Cheque/Other), note, builderId, createdBy }`. Indexes on `(labourId, date)` + `(siteId, date)`.

### Routes (`/api/labour-advances`)
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List advances. Query: `labourId`, `siteId`, `from`, `to`. Returns `{ data[], count, total }` |
| POST | `/` | SUPER_ADMIN, BUILDER, SUPERVISOR | Create advance |
| DELETE | `/:id` | SUPER_ADMIN, BUILDER | Delete |

### Integration with attendance summary
`GET /api/sites/:siteId/attendance/summary?month=&year=` (controller: `getLabourAttendanceSummary`) now:
1. Aggregates `Attendance` into per-labour `{ present, halfDay, absent, totalDays, earnings }`.
2. Calls `getAdvanceTotalsByLabour({ builderId, siteId, from, to })` (exported helper in `labourAdvance.controller.js`) which returns `{ [labourId]: totalAdvance }` for matching date range & site.
3. Each row gets `advance` + `balance = earnings − advance`.

### Payment register
Frontend route `/admin/labour-register/print?siteId=&month=&year=` consumes the summary endpoint and renders an A4-landscape register with Sr / Name / Category / Rate / P / HD / A / Total / Earnings / Advance / Balance / Signature column, plus footer totals + 3-column signature block (Prepared / Verified / Approved).

---

## 13. Material issue slip flow

### Purpose
Generate printable material issue slips (A5) when stock is issued to a contractor/worker on site, and stock arrival notes when stock is received from a vendor.

### Model additions
`models/materialLog.model.js` — existing `MaterialLog` extended with:
- `issueSlipNumber` — auto-generated for `type: 'Out'` (`ISS-YY-NNNN`, per builder)
- `issuedTo` — recipient (contractor/mistri/supervisor name)
- `purpose` — work context ("Slab casting — Block A", etc.)
- `vendorName`, `invoiceReference` — populated when `type: 'In'`

### Controller changes
`logMaterialMovement`:
- Decouples stock-in vs stock-out payloads.
- For `Out`, calls `generateIssueSlipNumber(builderId)` (counts existing Out logs).
- Returns saved log with slip number.

### New endpoint
`GET /api/materials/logs/:id` (`getMaterialLogById`) — returns populated log for print page.

### Routes (`/api/materials`)
Adds `GET /logs/:id` alongside existing `/`, `/log`, `/logs`.

### Print page
`/admin/material-slips/[logId]/print` — standalone A5 sheet:
- Title: "Material Issue Slip" (Out) or "Stock Arrival Note" (In).
- Slip No. + Date + Site block.
- Material table: name, qty, unit (bold, large).
- Context rows: Issued To / Purpose / Remarks (for Out) OR Vendor / Invoice Ref / Remarks (for In).
- 2-column signature block: Store Keeper + Received-By (or Verified-By for In).
- `@media print { @page { size: A5 } }`.

---

## 14. Expense receipt upload flow

### Purpose
Attach receipt images / PDFs to finance transactions for audit + GST evidence.

### Model changes
`models/transaction.model.js`:
- `receiptUrls: [String]` — CloudFront URLs (up to 5)
- `paymentMode` — enum Cash/UPI/Bank/Cheque/Other (default Cash)

### Route + middleware
`routes/finance.routes.js` adds `upload.array('receipts', 5)` multer middleware to both `POST /` and `PUT /:id`.

### Controller behaviour (`controllers/finance.controller.js`)
- `createTransaction`:
  - Accepts multipart OR JSON. Pre-uploaded URLs via `receiptUrls` body field (array or JSON string) are preserved; new uploaded files go to `s3://<bucket>/receipts/<builderId>/`.
  - All URLs merged and stored.
- `updateTransaction`:
  - Accepts `removeReceipt` (string or array of URLs) → retained URLs filtered out and deleted from S3 (best-effort via `deleteFile`).
  - New files in `req.files` appended.
- `deleteTransaction` best-effort removes S3 objects on delete.

### Frontend (both site FinanceTab + `/admin/finance`)
- Dialog form uses FormData; `transformRequest` strips `Content-Type` so browser sets multipart boundary.
- Thumbnail preview grid pre-submit (images) + PDF placeholder tile; per-item remove.
- Existing receipts shown with "mark for removal" overlay (greyed with red X) — toggled via `removeReceipt` field.
- Table column shows `ReceiptLong` icon with count; click opens lightbox with prev/next navigation. PDFs open in new tab via "Open PDF" button.

---

## 15. File upload flow

See `readme/FILE_UPLOAD_AND_S3.md` for full S3 upload pipeline.

---

*Last updated: 2026-04-22*
