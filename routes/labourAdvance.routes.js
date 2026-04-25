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
    const { getAdvances } = await import('../controllers/labourAdvance.controller.js');
    return getAdvances(req, res, next);
  }
);
router.post(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR),
  async (req, res, next) => {
    const { createAdvance } = await import('../controllers/labourAdvance.controller.js');
    return createAdvance(req, res, next);
  }
);
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteAdvance } = await import('../controllers/labourAdvance.controller.js');
  return deleteAdvance(req, res, next);
});

export default router;
