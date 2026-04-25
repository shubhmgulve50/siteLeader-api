# Architecture — siteLeader-api

## Runtime

Node.js 24, Express 5, JavaScript (CommonJS), MongoDB Atlas via Mongoose 8.
Two entry points: `index.js` (local Express server, port 3000) and `lambda.js` (AWS Lambda handler via `serverless-http`).

---

## Layers

```
HTTP / Lambda Event
  └── Express App
        ├── CORS middleware
        ├── contentTypeValidator       ← enforce application/json or multipart
        ├── Body parsers (JSON + multer)
        ├── routes/index.js            ← mounts all sub-routers under /api
        │     ├── auth.routes.js
        │     ├── site.routes.js
        │     ├── labour.routes.js
        │     ├── material.routes.js
        │     ├── finance.routes.js
        │     ├── quotation.routes.js
        │     └── admin.routes.js
        │           ↓
        │     middleware chain per route:
        │       authMiddleware → allowRoles() → builderScope → validateRequest(schema)
        │           ↓
        │     controller function
        │           ↓
        │     utils/dbUtils.js (Mongoose operations)
        │           ↓
        │     utils/utils.js (messageResponse / errorResponse)
        └── errorHandler               ← catches all thrown HttpError + unhandled
```

---

## Request lifecycle

1. Request arrives (HTTP or Lambda event).
2. **CORS** — allowed origins from `process.env.CORS_ORIGINS`.
3. **`contentTypeValidator`** — rejects requests with wrong Content-Type.
4. **`authMiddleware`** (`middleware/auth.middleware.js`):
   - Extracts Bearer token from `Authorization` header or cookie.
   - Verifies with `jsonwebtoken` + `JWT_SECRET`.
   - Attaches decoded user to `req.user`.
5. **`allowRoles(...roles)`** (`middleware/role.middleware.js`):
   - Checks `req.user.role` against allowed roles.
   - Throws `HttpError(403)` if denied.
6. **`builderScope`** (`middleware/builder.middleware.js`):
   - Injects `builderId` filter into `req.query` based on role:
     - `SUPER_ADMIN` → no filter (sees all tenants).
     - `BUILDER` → `builderId = req.user._id`.
     - `SUPERVISOR/ENGINEER/WORKER` → `builderId = req.user.builderId`.
7. **`validateRequest(schema)`** — Joi validation; throws 422 on failure.
8. **Controller** executes business logic, calls `dbUtils` or model directly.
9. **`messageResponse`** / **`errorResponse`** sends standardised JSON.
10. **`errorHandler`** catches any thrown `HttpError` and sends structured error response.

---

## Multi-tenant data isolation

Every Mongoose model with tenant data carries a `builderId` field.
`builderScope` middleware populates `req.builderFilter` = `{ builderId }` (or `{}` for SUPER_ADMIN).
Controllers spread this filter into every `.find()` / `.findOne()` query to prevent cross-tenant data leaks.

---

## Key integrations

| Integration | Location | Purpose |
|---|---|---|
| MongoDB Atlas | `config/db.js` | Primary data store |
| JWT | `utils/auth.js`, `utils/jwt.js` | Token generation + verification |
| bcryptjs | `utils/auth.js` | Password hashing |
| AWS S3 | `utils/file_upload.js`, `constants/s3Upload.js` | File storage + presigned URLs |
| CloudFront | `constants/s3Upload.js` | CDN for stored files |
| PDFKit | `controllers/` (quotation) | PDF generation |
| Puppeteer | `controllers/` | Headless browser for complex PDF rendering |
| GitHub Actions | `.github/workflows/deploy_lambda.yml` | CI/CD to Lambda |

---

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Express listen port (default 3000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_EXPIRES` | Access token TTL (e.g. `7d`) |
| `COOKIE_EXPIRES` | Cookie max-age |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `AWS_ACCESS_KEY_ID` | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials |
| `AWS_REGION` | e.g. `ap-south-1` |
| `AWS_BUCKET_NAME` | S3 bucket name |
| `AWS_BUCKET_URL` | S3 bucket base URL |
| `AWS_CLOUDFRONT_URL` | CDN base URL (`https://d1ee7knodiza2n.cloudfront.net`) |

---

*Last updated: 2026-04-17*
