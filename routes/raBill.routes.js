import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';
import { ROLE } from '../constants/constants.js';

const router = express.Router();

router.use(authMiddleware);
router.use(builderScope);

router.get(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getRaBills } = await import('../controllers/raBill.controller.js');
    return getRaBills(req, res, next);
  }
);
router.get(
  '/seed',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { seedRaBill } = await import('../controllers/raBill.controller.js');
    return seedRaBill(req, res, next);
  }
);
router.get(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getRaBillById } = await import('../controllers/raBill.controller.js');
    return getRaBillById(req, res, next);
  }
);
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createRaBill } = await import('../controllers/raBill.controller.js');
  return createRaBill(req, res, next);
});
router.put('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { updateRaBill } = await import('../controllers/raBill.controller.js');
  return updateRaBill(req, res, next);
});
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteRaBill } = await import('../controllers/raBill.controller.js');
  return deleteRaBill(req, res, next);
});

export default router;
