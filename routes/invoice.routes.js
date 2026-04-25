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
    const { getInvoices } = await import('../controllers/invoice.controller.js');
    return getInvoices(req, res, next);
  }
);
router.get(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getInvoiceById } = await import('../controllers/invoice.controller.js');
    return getInvoiceById(req, res, next);
  }
);
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createInvoice } = await import('../controllers/invoice.controller.js');
  return createInvoice(req, res, next);
});
router.put('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { updateInvoice } = await import('../controllers/invoice.controller.js');
  return updateInvoice(req, res, next);
});
router.post(
  '/:id/payments',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER),
  async (req, res, next) => {
    const { recordPayment } = await import('../controllers/invoice.controller.js');
    return recordPayment(req, res, next);
  }
);
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteInvoice } = await import('../controllers/invoice.controller.js');
  return deleteInvoice(req, res, next);
});

export default router;
