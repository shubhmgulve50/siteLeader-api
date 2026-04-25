# Deployment — siteLeader-api

## Entry points

| File | Purpose |
|---|---|
| `index.js` | Local Express server (port 3000 or `process.env.PORT`). Connects to MongoDB with retry (3 attempts, 5s delay). |
| `lambda.js` | AWS Lambda handler. Wraps Express app with `serverless-http`. No port binding. |

---

## Lambda handler (`lambda.js`)

```javascript
const serverless = require('serverless-http');
const app = require('./app');  // Express app (without listen)

module.exports.handler = serverless(app);
```

Lambda receives API Gateway events, `serverless-http` translates them to Express-compatible `req`/`res` objects.

Database connection is cached in `config/db.js` — `isConnected` flag prevents reconnect on warm Lambda invocations.

---

## GitHub Actions CI/CD

**File:** `.github/workflows/deploy_lambda.yml`

### Trigger
Pushes to `main` branch.

### Steps (general pattern)
1. Checkout code.
2. Set up Node.js.
3. `npm ci` — install dependencies.
4. Deploy to AWS Lambda (likely via AWS CLI, SAM, or Serverless Framework).

Review `.github/workflows/deploy_lambda.yml` for exact deploy commands and IAM role requirements.

---

## MongoDB connection (`config/db.js`)

```javascript
let isConnected = false;

async function connectDB() {
  if (isConnected) return;   // reuse on Lambda warm starts
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;
}
```

Called at startup in `index.js` (with retry) and at the top of `lambda.js` handler.

---

## Environment variables for production

Set these in Lambda environment or via AWS Parameter Store:

```
MONGODB_URI=<atlas_connection_string>
JWT_SECRET=<32_char_hex>
JWT_REFRESH_SECRET=<32_char_hex>
JWT_EXPIRES=7d
COOKIE_EXPIRES=7d
CORS_ORIGINS=https://admin.yourdomain.com,https://app.yourdomain.com
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=marriage-matrimony
AWS_BUCKET_URL=<s3_bucket_url>
AWS_CLOUDFRONT_URL=https://d1ee7knodiza2n.cloudfront.net
```

Do not set `PORT` in Lambda — it is ignored.

---

## Local development

```bash
npm run dev     # nodemon index.js (hot reload)
npm start       # node index.js
npm run lint    # eslint
```

---

*Last updated: 2026-04-17*
