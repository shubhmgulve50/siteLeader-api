# Methods — siteLeader-api

## `utils/dbUtils.js` — `createDbUtils(Model)`

Factory function returning a typed set of database operations for a Mongoose model.

```javascript
const siteUtils = createDbUtils(SiteModel);
```

### Methods

| Method | Signature | Notes |
|---|---|---|
| `findById` | `(id, populate?, lean?)` | Validates ObjectId; throws `HttpError(404)` if not found |
| `findOne` | `(query, projection?, options?, populate?, throwWhenNotFound?, lean?)` | Flexible single-doc fetch |
| `findAll` | `(query, projection?, options?, populate?, lean?)` | Fetches multiple docs |
| `create` | `(data)` | Inserts document |
| `updateById` | `(id, update, options?)` | `findByIdAndUpdate` with `{ new: true }` default |
| `deleteById` | `(id)` | `findByIdAndDelete` |
| `deleteByField` | `(field, value)` | Delete by arbitrary field |
| `paginate` | `({ query, page, limit, sort, projection, populate })` | Max 100 items/page |
| `deleteManyByIds` | `(ids[])` | Bulk delete by ID array |
| `aggregate` | `(pipeline)` | Raw aggregation pipeline |
| `countDocuments` | `(query)` | Count matching docs |

All ID-based operations validate ObjectId and return `HttpError(400)` on invalid format.

---

## `utils/utils.js` — Response helpers

#### `messageResponse(res, message, statusCode, data)`
Sends success response:
```json
{ "success": true, "message": "...", "data": {...} }
```

#### `errorResponse(res, error, data?)`
Sends error response from `HttpError`:
```json
{ "success": false, "message": "...", "errorData": {...} }
```

---

## `utils/httpError.js` — `HttpError`

```javascript
throw new HttpError('Not found', 404);
throw new HttpError('Validation failed', 422, { field: 'email' });
```

Caught by `middleware/errorHandler.js` which formats the response and attaches `stack` in development.

---

## `utils/auth.js` — Token utilities

#### `generateAccessToken(payload)`
Signs JWT with `JWT_SECRET`, expiry from `JWT_EXPIRES` env var.

#### `generateRefreshToken(payload)`
Signs JWT with `JWT_REFRESH_SECRET`.

#### `comparePassword(plain, hash)`
`bcryptjs.compare` wrapper; returns boolean.

#### `hashPassword(plain)`
`bcryptjs.hash` with salt rounds = 10.

---

## `utils/jwt.js`

#### `verifyToken(token, secret)`
`jsonwebtoken.verify` wrapper. Throws `HttpError(401)` on invalid token.

---

## `middleware/validateRequest.js`

Joi-based request validation middleware factory:
```javascript
router.post('/', validateRequest(authSchema), controller.login);
```
Validates `req.body` against Joi schema. On failure → `next(new HttpError(422, errorDetails))`.

---

## `middleware/role.middleware.js`

#### `allowRoles(...roles)`
Returns Express middleware that checks `req.user.role` against the `roles` array.
```javascript
router.post('/', authMiddleware, allowRoles('SUPER_ADMIN', 'BUILDER'), controller.create);
```

---

## `middleware/builder.middleware.js` — `builderScope`

Injects `req.builderFilter` and `req.builderId` based on user role:
- `SUPER_ADMIN` → `builderFilter = {}`, `builderId = null`
- `BUILDER` → `builderFilter = { builderId: req.user._id }`
- `SUPERVISOR/ENGINEER/WORKER` → `builderFilter = { builderId: req.user.builderId }`

Spread into queries: `Model.find({ ...req.builderFilter })`.

---

## `constants/constants.js`

#### `ROLES`
```javascript
{ SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER, WORKER }
```

---

## `constants/s3Upload.js`

Exports configured `S3Client` instance and bucket/CloudFront constants.
Import this for any S3 operation — never instantiate `S3Client` inline.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | 5.1.0 | Web framework |
| `mongoose` | 8.14.1 | MongoDB ODM |
| `jsonwebtoken` | 9.0.2 | JWT sign/verify |
| `bcryptjs` | 3.0.2 | Password hashing |
| `joi` | 17.13.3 | Request validation |
| `moment` | 2.30.1 | Date formatting |
| `axios` | 1.10.0 | HTTP client (internal calls) |
| `multer` | 1.4.5 | Multipart file handling |
| `@aws-sdk/client-s3` | latest | S3 operations |
| `@aws-sdk/s3-request-presigner` | latest | Presigned URLs |
| `pdfkit` | 0.17.1 | PDF generation |
| `puppeteer` | 24.11.2 | Headless browser PDF |
| `uuid` | 11.1.0 | Unique file naming |

---

*Last updated: 2026-04-17*
