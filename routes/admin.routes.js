import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(builderScope);

router.get('/profile', async (req, res, next) => {
  const { getProfile } = await import('../controllers/admin.controller.js');
  return getProfile(req, res, next);
});
router.get('/dashboard-stats', async (req, res, next) => {
  const { getDashboardStats } = await import('../controllers/admin.controller.js');
  return getDashboardStats(req, res, next);
});

export default router;
