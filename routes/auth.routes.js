import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { ROLE } from '../constants/constants.js';

const router = express.Router();

// Public — builder self-registration
router.post('/register/builder', async (req, res, next) => {
  const { builderRegister } = await import('../controllers/auth.controller.js');
  return builderRegister(req, res, next);
});

// Public — email verification
router.post('/verify-email', async (req, res, next) => {
  const { verifyEmail } = await import('../controllers/auth.controller.js');
  return verifyEmail(req, res, next);
});

// Public — resend verification email
router.post('/resend-verification', async (req, res, next) => {
  const { resendVerification } = await import('../controllers/auth.controller.js');
  return resendVerification(req, res, next);
});

// Public
router.post('/login', async (req, res, next) => {
  const { login } = await import('../controllers/auth.controller.js');
  return login(req, res, next);
});
router.post('/logout', async (req, res, next) => {
  const { logout } = await import('../controllers/auth.controller.js');
  return logout(req, res, next);
});

// Protected — SUPER_ADMIN creates BUILDERs, BUILDER creates team members
router.post('/register', authMiddleware, allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { register } = await import('../controllers/auth.controller.js');
  return register(req, res, next);
});

export default router;
