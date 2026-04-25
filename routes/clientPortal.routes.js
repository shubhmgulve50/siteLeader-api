import express from 'express';

// Public router — NO auth middleware
const router = express.Router();

router.get('/:token', async (req, res, next) => {
  const { getPublicPortal } = await import('../controllers/clientPortal.controller.js');
  return getPublicPortal(req, res, next);
});

export default router;
