# API Integration — siteLeader-api

## Route organisation

All routes mounted in `routes/index.js`:

```javascript
router.use('/auth', authRoutes);
router.use('/sites', siteRoutes);
router.use('/labours', labourRoutes);
router.use('/materials', materialRoutes);
router.use('/finance', financeRoutes);
router.use('/quotations', quotationRoutes);
router.use('/admin', adminRoutes);
```

Mounted on Express app: `app.use('/api', router)`.

---

## Adding a new resource

1. Create `models/<resource>.model.js` with `builderId` field.
2. Create `schemas/<resource>.js` with Joi validation.
3. Create `controllers/<resource>.controller.js` — spread `req.builderFilter` in all queries.
4. Create `routes/<resource>.routes.js`:
   ```javascript
   router.get('/', authMiddleware, builderScope, controller.getAll);
   router.post('/', authMiddleware, allowRoles('SUPER_ADMIN', 'BUILDER'), builderScope, validateRequest(schema), controller.create);
   ```
5. Mount in `routes/index.js`.
6. Update `readme/UI.md` with new route table.
7. Update `readme/FLOWS.md` with end-to-end flow.

---

## Validation pattern

Joi schemas live in `schemas/`. Validation applied via `validateRequest` middleware:

```javascript
const schema = Joi.object({
  name: Joi.string().required(),
  amount: Joi.number().positive().required(),
});

router.post('/', validateRequest(schema), controller.create);
```

The middleware calls `schema.validate(req.body, { abortEarly: false })` and passes a `HttpError(422)` to `next` on failure.

---

## Multi-tenant query pattern

```javascript
// In controller:
const items = await Model.find({ ...req.builderFilter });

// Create with builderId:
const item = await Model.create({ ...req.body, builderId: req.builderId });
```

`req.builderFilter` is populated by `builderScope` middleware.
`req.builderId` is the resolved builderId for new document creation.

---

## Standard response format

Always use helpers from `utils/utils.js`:

```javascript
// Success
messageResponse(res, 'Site created', 201, { site });

// Error (caught by errorHandler)
throw new HttpError('Not found', 404);
```

Never call `res.json()` directly in controllers.

---

## dbUtils factory pattern

```javascript
const siteUtils = createDbUtils(Site);

// In controller:
const site = await siteUtils.findById(req.params.id);
const sites = await siteUtils.findAll({ ...req.builderFilter });
await siteUtils.updateById(req.params.id, req.body);
await siteUtils.deleteById(req.params.id);
```

Prefer `dbUtils` over raw Mongoose calls for consistent error handling and ObjectId validation.

---

*Last updated: 2026-04-17*
