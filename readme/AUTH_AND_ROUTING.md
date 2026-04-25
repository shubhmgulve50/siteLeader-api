# Auth and Routing — siteLeader-api

## JWT token lifecycle

**Files:** `utils/auth.js`, `utils/jwt.js`, `middleware/auth.middleware.js`

### Token generation (`utils/auth.js`)

```javascript
generateAccessToken(payload)   // signs with JWT_SECRET, TTL = JWT_EXPIRES (e.g. '7d')
generateRefreshToken(payload)  // signs with JWT_REFRESH_SECRET
hashPassword(plain)            // bcryptjs.hash, salt rounds 10
comparePassword(plain, hash)   // bcryptjs.compare
```

### Token verification (`middleware/auth.middleware.js`)

1. Extracts token from `Authorization: Bearer <token>` header or `req.cookies.token`.
2. `verifyToken(token, JWT_SECRET)` → decoded payload.
3. `User.findById(payload.id)` — ensures user still exists.
4. Attaches `req.user = user`.
5. On failure → `next(new HttpError('Unauthorised', 401))`.

### Advanced auth (`middleware/authenticate.js`)

Extended middleware that additionally handles refresh token rotation. Use `authenticate` instead of `authMiddleware` on endpoints that need refresh token support.

---

## Role-based access control

**File:** `middleware/role.middleware.js`

### Roles (`constants/constants.js`)

```javascript
ROLES = { SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER, WORKER }
```

### `allowRoles(...roles)` middleware

```javascript
router.post('/', authMiddleware, allowRoles('SUPER_ADMIN', 'BUILDER'), controller.create);
```

Checks `req.user.role` against `roles` array. Throws `HttpError(403, 'Forbidden')` on mismatch.

---

## Multi-tenant builder scope

**File:** `middleware/builder.middleware.js`

### `builderScope` middleware

Injects `req.builderFilter` object:

| Role | `req.builderFilter` value |
|---|---|
| `SUPER_ADMIN` | `{}` (no filter — sees all tenants) |
| `BUILDER` | `{ builderId: req.user._id }` |
| `SUPERVISOR` / `ENGINEER` / `WORKER` | `{ builderId: req.user.builderId }` |

Every controller that queries tenant-scoped data must spread this filter:
```javascript
const sites = await Site.find({ ...req.builderFilter });
```

---

## Route map

All routes mounted in `routes/index.js` under `/api`:

| Router file | Mount path |
|---|---|
| `auth.routes.js` | `/api/auth` |
| `site.routes.js` | `/api/sites` |
| `labour.routes.js` | `/api/labours` |
| `material.routes.js` | `/api/materials` |
| `finance.routes.js` | `/api/finance` |
| `quotation.routes.js` | `/api/quotations` |
| `admin.routes.js` | `/api/admin` |
| `example.routes.js` | `/api/example` (health/placeholder) |

### Middleware chain pattern per protected route

```javascript
router.post(
  '/',
  authMiddleware,          // 1. verify token, attach req.user
  allowRoles('BUILDER'),   // 2. check role
  builderScope,            // 3. inject req.builderFilter
  validateRequest(schema), // 4. Joi validation
  controller.create        // 5. business logic
);
```

---

## User hierarchy

```
SUPER_ADMIN
  └── creates BUILDER (builderId = null, owns tenant)
        └── creates SUPERVISOR / ENGINEER / WORKER
              (builderId = parent BUILDER._id)
```

SUPER_ADMIN can see all tenants' data.
BUILDER sees only own tenant.
SUPERVISOR / ENGINEER / WORKER see their builder's tenant data.

---

*Last updated: 2026-04-17*
