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
    const { getMaterials } = await import('../controllers/material.controller.js');
    return getMaterials(req, res, next);
  }
);
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createMaterial } = await import('../controllers/material.controller.js');
  return createMaterial(req, res, next);
});
router.put(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { updateMaterial } = await import('../controllers/material.controller.js');
    return updateMaterial(req, res, next);
  }
);
router.delete(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { deleteMaterial } = await import('../controllers/material.controller.js');
    return deleteMaterial(req, res, next);
  }
);

router.post(
  '/log',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { logMaterialMovement } = await import('../controllers/material.controller.js');
    return logMaterialMovement(req, res, next);
  }
);
router.post(
  '/transfer',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR),
  async (req, res, next) => {
    const { transferMaterial } = await import('../controllers/material.controller.js');
    return transferMaterial(req, res, next);
  }
);
router.get(
  '/logs',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getMaterialLogs } = await import('../controllers/material.controller.js');
    return getMaterialLogs(req, res, next);
  }
);
router.get(
  '/logs/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getMaterialLogById } = await import('../controllers/material.controller.js');
    return getMaterialLogById(req, res, next);
  }
);

export default router;
