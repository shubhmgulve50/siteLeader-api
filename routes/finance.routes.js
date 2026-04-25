import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';
import { ROLE } from '../constants/constants.js';
import { upload } from '../utils/file_upload.js';

const router = express.Router();

router.use(authMiddleware);
router.use(builderScope);

// Pending approvals — must come before `/:id` routes
router.get(
  '/pending-approvals',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getPendingApprovals } = await import('../controllers/finance.controller.js');
    return getPendingApprovals(req, res, next);
  }
);

// GET & POST - All staff roles (internal logic handles filtering)
router.get(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getTransactions } = await import('../controllers/finance.controller.js');
    return getTransactions(req, res, next);
  }
);
router.post(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  upload.array('receipts', 5),
  async (req, res, next) => {
    const { createTransaction } = await import('../controllers/finance.controller.js');
    return createTransaction(req, res, next);
  }
);

// UPDATE & DELETE - All roles
router.put(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  upload.array('receipts', 5),
  async (req, res, next) => {
    const { updateTransaction } = await import('../controllers/finance.controller.js');
    return updateTransaction(req, res, next);
  }
);
router.delete(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { deleteTransaction } = await import('../controllers/finance.controller.js');
    return deleteTransaction(req, res, next);
  }
);

// Approval actions — builder only
router.post('/:id/approve', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { approveTransaction } = await import('../controllers/finance.controller.js');
  return approveTransaction(req, res, next);
});
router.post('/:id/reject', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { rejectTransaction } = await import('../controllers/finance.controller.js');
  return rejectTransaction(req, res, next);
});

export default router;
