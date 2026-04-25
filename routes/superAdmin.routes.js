import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { ROLE } from '../constants/constants.js';

const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles(ROLE.SUPER_ADMIN));

router.get('/builders', async (req, res, next) => {
  const { getBuilders } = await import('../controllers/superAdmin.controller.js');
  return getBuilders(req, res, next);
});

router.get('/builders/:id', async (req, res, next) => {
  const { getBuilderById } = await import('../controllers/superAdmin.controller.js');
  return getBuilderById(req, res, next);
});

router.post('/builders/:id/approve', async (req, res, next) => {
  const { approveBuilder } = await import('../controllers/superAdmin.controller.js');
  return approveBuilder(req, res, next);
});

router.post('/builders/:id/deny', async (req, res, next) => {
  const { denyBuilder } = await import('../controllers/superAdmin.controller.js');
  return denyBuilder(req, res, next);
});

router.post('/builders/:id/suspend', async (req, res, next) => {
  const { suspendBuilder } = await import('../controllers/superAdmin.controller.js');
  return suspendBuilder(req, res, next);
});

router.post('/builders/:id/reinstate', async (req, res, next) => {
  const { reinstateBuilder } = await import('../controllers/superAdmin.controller.js');
  return reinstateBuilder(req, res, next);
});

router.put('/builders/:id/permissions', async (req, res, next) => {
  const { setBuilderPermissions } = await import('../controllers/superAdmin.controller.js');
  return setBuilderPermissions(req, res, next);
});

router.post('/builders/:id/verify-email', async (req, res, next) => {
  const { verifyBuilderEmail } = await import('../controllers/superAdmin.controller.js');
  return verifyBuilderEmail(req, res, next);
});

router.delete('/builders/:id', async (req, res, next) => {
  const { deleteBuilder } = await import('../controllers/superAdmin.controller.js');
  return deleteBuilder(req, res, next);
});

export default router;
