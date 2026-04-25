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
    const { getVendors } = await import('../controllers/vendor.controller.js');
    return getVendors(req, res, next);
  }
);
router.get(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getVendorById } = await import('../controllers/vendor.controller.js');
    return getVendorById(req, res, next);
  }
);
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createVendor } = await import('../controllers/vendor.controller.js');
  return createVendor(req, res, next);
});
router.put('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { updateVendor } = await import('../controllers/vendor.controller.js');
  return updateVendor(req, res, next);
});
router.post('/:id/payments', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { recordVendorPayment } = await import('../controllers/vendor.controller.js');
  return recordVendorPayment(req, res, next);
});
router.post('/:id/bills', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { recordVendorBill } = await import('../controllers/vendor.controller.js');
  return recordVendorBill(req, res, next);
});
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteVendor } = await import('../controllers/vendor.controller.js');
  return deleteVendor(req, res, next);
});

export default router;
