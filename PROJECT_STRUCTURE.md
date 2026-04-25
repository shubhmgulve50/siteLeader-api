# Node.js project structure — siteLeader-api

```
siteLeader-api/
├── CLAUDE.md                          # Root intelligence hub — lists all README paths
├── AGENTS.md                          # Agent registry and deployment info
├── PROJECT_STRUCTURE.md               # This file
├── .claudeignore                      # Same as .gitignore (kept in sync)
├── .claude/
│   ├── RULES.md                       # Standing instructions (always read first)
│   └── skills/
│       ├── new-feature.md
│       ├── pr-workflow.md
│       ├── readme-sync.md
│       ├── code-review.md
│       └── ticket.md
├── readme/                            # Central documentation hub
│   ├── ARCHITECTURE.md
│   ├── FLOWS.md
│   ├── UI.md
│   ├── THEMING.md
│   ├── METHODS.md
│   ├── AUTH_AND_ROUTING.md
│   ├── API_INTEGRATION.md
│   ├── FILE_UPLOAD_AND_S3.md
│   └── DEPLOYMENT.md
├── .github/
│   └── workflows/
│       └── deploy_lambda.yml          # GitHub Actions: deploy to AWS Lambda
├── config/
│   └── db.js                          # MongoDB connection with caching + retry
├── constants/
│   ├── constants.js                   # ROLES enum, shared app constants
│   ├── s3Upload.js                    # S3 client config + bucket constants
│   └── image/
│       ├── ganpati.png                # Static image assets (used in PDF generation)
│       └── logo.png
├── controllers/
│   ├── auth.controller.js             # Login, logout, register, change-password
│   ├── site.controller.js             # Site CRUD
│   ├── siteOperation.controller.js    # Labour assign, attendance, daily logs, stats
│   ├── labour.controller.js           # Labour master CRUD
│   ├── material.controller.js         # Material catalog + stock log CRUD
│   ├── finance.controller.js          # Transaction CRUD + income/expense summary
│   ├── quotation.controller.js        # Quotation CRUD + sequential numbering
│   └── admin.controller.js            # Profile, dashboard stats aggregation
├── middleware/
│   ├── auth.middleware.js             # JWT extraction + user attach (req.user)
│   ├── authenticate.js                # Advanced auth with token refresh logic
│   ├── builder.middleware.js          # Injects builderId scope filter into req.query
│   ├── role.middleware.js             # allowRoles(...roles) factory
│   ├── contentTypeValidator.js        # Enforces application/json or multipart
│   ├── errorHandler.js                # Central error handler middleware
│   └── validateRequest.js            # Joi schema validation middleware
├── models/
│   ├── user.model.js                  # User: email, password, role, builderId
│   ├── site.model.js                  # Site: name, address, status, budget, supervisor
│   ├── labour.model.js                # Labour: name, type, dailyWage, builderId
│   ├── material.model.js              # Material: name, unit, currentStock, minStock
│   ├── materialLog.model.js           # Stock movement: type (In/Out), qty, siteId
│   ├── siteLabour.model.js            # Junction: siteId + labourId (unique constraint)
│   ├── attendance.model.js            # Daily attendance: labourId + date + status
│   ├── dailyLog.model.js              # Daily progress report with images[]
│   ├── transaction.model.js           # Finance: type, amount, category, siteId
│   └── quotation.model.js             # BOQ: items[], taxPercentage, totalAmount
├── routes/
│   ├── index.js                       # Mounts all sub-routers under /api
│   ├── auth.routes.js                 # POST /login, /logout, /register
│   ├── site.routes.js                 # CRUD /sites + site operations
│   ├── labour.routes.js               # CRUD /labours
│   ├── material.routes.js             # CRUD /materials + POST /materials/log
│   ├── finance.routes.js              # CRUD /finance
│   ├── quotation.routes.js            # CRUD /quotations
│   ├── admin.routes.js                # GET /admin/profile, /admin/dashboard-stats
│   └── example.routes.js             # Placeholder / health check
├── schemas/
│   ├── auth.js                        # Joi: login, register validation
│   ├── changePasswordSchema.js        # Joi: password change
│   ├── checkEmailSchema.js            # Joi: email check
│   └── user.js                        # Joi: full user profile with conditional fields
├── utils/
│   ├── auth.js                        # generateAccessToken, generateRefreshToken
│   ├── jwt.js                         # verifyToken helper
│   ├── httpError.js                   # HttpError class (message, statusCode, errorData)
│   ├── utils.js                       # messageResponse, errorResponse helpers
│   ├── dbUtils.js                     # createDbUtils(Model) factory: CRUD + paginate
│   ├── file_upload.js                 # Multer + S3 upload/delete/presigned URL
│   └── superAdmin.js                  # Super admin seeding utility
├── data/                              # Static seed/reference data files
├── index.js                           # Express server entry (port 3000, DB retry)
├── lambda.js                          # AWS Lambda handler wrapper
├── .env                               # Environment variables (gitignored)
├── .prettierrc                        # Prettier config
├── eslint.config.js                   # ESLint flat config
├── package.json                       # Dependencies & scripts
├── package-lock.json
└── README.md
```

## Package conventions

| Concern | Package |
|---|---|
| Web framework | `express` v5.1.0 |
| Database | `mongoose` v8.14.1 (MongoDB Atlas) |
| Auth tokens | `jsonwebtoken` v9.0.2 |
| Password hashing | `bcryptjs` v3.0.2 |
| Validation | `joi` v17.13.3 |
| Date/time | `moment` v2.30.1 |
| HTTP client | `axios` v1.10.0 |
| File upload | `multer` v1.4.5 |
| AWS S3 | `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` |
| PDF generation | `pdfkit` v0.17.1 |
| Headless browser | `puppeteer` v24.11.2 |
| Unique IDs | `uuid` v11.1.0 |
| Serverless | `serverless-http` (Lambda wrapper) |

## Framework Versions

- Node.js: v24.12.0
- npm: v10.9.1
- Express: v5.1.0

## Default branches

- `main` — production-ready, protected
- `dev` — integration; all feature PRs target this branch
