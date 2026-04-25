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
    const { getMilestones } = await import('../controllers/milestone.controller.js');
    return getMilestones(req, res, next);
  }
);
router.post(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { createMilestone } = await import('../controllers/milestone.controller.js');
    return createMilestone(req, res, next);
  }
);
router.post(
  '/reorder',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { reorderMilestones } = await import('../controllers/milestone.controller.js');
    return reorderMilestones(req, res, next);
  }
);
router.put(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { updateMilestone } = await import('../controllers/milestone.controller.js');
    return updateMilestone(req, res, next);
  }
);
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteMilestone } = await import('../controllers/milestone.controller.js');
  return deleteMilestone(req, res, next);
});

export default router;
