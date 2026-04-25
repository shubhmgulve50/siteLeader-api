import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';
import { ROLE } from '../constants/constants.js';
import { upload } from '../utils/file_upload.js';

const router = express.Router();

router.use(authMiddleware);
router.use(builderScope);

router.get(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getIncidents } = await import('../controllers/safetyIncident.controller.js');
    return getIncidents(req, res, next);
  }
);
router.post(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  upload.array('images', 6),
  async (req, res, next) => {
    const { createIncident } = await import('../controllers/safetyIncident.controller.js');
    return createIncident(req, res, next);
  }
);
router.put(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR),
  async (req, res, next) => {
    const { updateIncident } = await import('../controllers/safetyIncident.controller.js');
    return updateIncident(req, res, next);
  }
);
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteIncident } = await import('../controllers/safetyIncident.controller.js');
  return deleteIncident(req, res, next);
});

export default router;
