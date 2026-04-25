import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';
import { ROLE } from '../constants/constants.js';
import { upload } from '../utils/file_upload.js';

const router = express.Router();

// All routes are protected by authentication and builderScope
router.use(authMiddleware);
router.use(builderScope);

// GET sites - All roles (content filtered by builderScope)
router.get(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getSites } = await import('../controllers/site.controller.js');
    return getSites(req, res, next);
  }
);

router.get(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getSiteById } = await import('../controllers/site.controller.js');
    return getSiteById(req, res, next);
  }
);

// CREATE site - SUPER_ADMIN and BUILDER
router.post('/', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { createSite } = await import('../controllers/site.controller.js');
  return createSite(req, res, next);
});

// UPDATE site - SUPER_ADMIN and BUILDER
router.put('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { updateSite } = await import('../controllers/site.controller.js');
  return updateSite(req, res, next);
});

// DELETE site - SUPER_ADMIN and BUILDER
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteSite } = await import('../controllers/site.controller.js');
  return deleteSite(req, res, next);
});

// Client portal
router.post('/:id/portal', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { enableClientPortal } = await import('../controllers/clientPortal.controller.js');
  return enableClientPortal(req, res, next);
});
router.delete('/:id/portal', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { disableClientPortal } = await import('../controllers/clientPortal.controller.js');
  return disableClientPortal(req, res, next);
});

// --- SITE OPERATIONS ---

// Stats & Performance
router.get('/:siteId/stats', async (req, res, next) => {
  const { getSiteStats } = await import('../controllers/siteOperation.controller.js');
  return getSiteStats(req, res, next);
});

// Labour Assignment
router.post('/assign-labour', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { assignLabourToSite } = await import('../controllers/siteOperation.controller.js');
  return assignLabourToSite(req, res, next);
});
router.get('/:siteId/labour', async (req, res, next) => {
  const { getSiteLabour } = await import('../controllers/siteOperation.controller.js');
  return getSiteLabour(req, res, next);
});

// Attendance
router.post(
  '/attendance',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR),
  async (req, res, next) => {
    const { markAttendance } = await import('../controllers/siteOperation.controller.js');
    return markAttendance(req, res, next);
  }
);
router.get('/:siteId/attendance', async (req, res, next) => {
  const { getSiteAttendance } = await import('../controllers/siteOperation.controller.js');
  return getSiteAttendance(req, res, next);
});
router.get('/:siteId/attendance/summary', async (req, res, next) => {
  const { getLabourAttendanceSummary } = await import('../controllers/siteOperation.controller.js');
  return getLabourAttendanceSummary(req, res, next);
});
router.get('/:siteId/labour/:labourId/calendar', async (req, res, next) => {
  const { getLabourAttendanceCalendar } = await import('../controllers/siteOperation.controller.js');
  return getLabourAttendanceCalendar(req, res, next);
});

// Daily Logs (DPR) — multipart for optional image upload (up to 10 photos)
router.post(
  '/logs',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  upload.array('images', 10),
  async (req, res, next) => {
    const { createDailyLog } = await import('../controllers/siteOperation.controller.js');
    return createDailyLog(req, res, next);
  }
);
router.get('/:siteId/logs', async (req, res, next) => {
  const { getSiteLogs } = await import('../controllers/siteOperation.controller.js');
  return getSiteLogs(req, res, next);
});

export default router;
