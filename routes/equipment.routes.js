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
    const { getEquipment } = await import('../controllers/equipment.controller.js');
    return getEquipment(req, res, next);
  }
);
router.get(
  '/logs',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getAllEquipmentLogs } = await import('../controllers/equipment.controller.js');
    return getAllEquipmentLogs(req, res, next);
  }
);
router.get(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getEquipmentById } = await import('../controllers/equipment.controller.js');
    return getEquipmentById(req, res, next);
  }
);
router.get(
  '/:id/logs',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getEquipmentLogs } = await import('../controllers/equipment.controller.js');
    return getEquipmentLogs(req, res, next);
  }
);
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createEquipment } = await import('../controllers/equipment.controller.js');
  return createEquipment(req, res, next);
});
router.put('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { updateEquipment } = await import('../controllers/equipment.controller.js');
  return updateEquipment(req, res, next);
});
router.post(
  '/:id/logs',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { addEquipmentLog } = await import('../controllers/equipment.controller.js');
    return addEquipmentLog(req, res, next);
  }
);
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteEquipment } = await import('../controllers/equipment.controller.js');
  return deleteEquipment(req, res, next);
});

export default router;
