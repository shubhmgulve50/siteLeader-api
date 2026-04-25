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
    const { getLabours } = await import('../controllers/labour.controller.js');
    return getLabours(req, res, next);
  }
);
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createLabour } = await import('../controllers/labour.controller.js');
  return createLabour(req, res, next);
});
router.put('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { updateLabour } = await import('../controllers/labour.controller.js');
  return updateLabour(req, res, next);
});
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteLabour } = await import('../controllers/labour.controller.js');
  return deleteLabour(req, res, next);
});

export default router;
