import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';
import { ROLE } from '../constants/constants.js';

const router = express.Router();

/**
 * @route   GET /api/example/sites
 * @desc    Get sites based on builder scope
 * @access  Private (SUPER_ADMIN, BUILDER, SUPERVISOR)
 */
router.get(
  '/sites',
  authMiddleware,
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR),
  builderScope,
  async (req, res) => {
    try {
      // In a real scenario you would query the Sites model using req.builderFilter
      // Example: const sites = await Site.find(req.builderFilter);

      res.status(200).json({
        message: 'Successfully retrieved sites',
        filterApplied: req.builderFilter,
        // data: sites
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/example/attendance
 * @desc    Mark attendance for a worker
 * @access  Private (BUILDER, SUPERVISOR)
 */
router.post(
  '/attendance',
  authMiddleware,
  allowRoles(ROLE.BUILDER, ROLE.SUPERVISOR),
  builderScope,
  async (req, res) => {
    try {
      // Create new attendance record. Provide builderId from req.builderFilter if adding
      // e.g. Attendance.create({ ...req.body, builderId: req.builderFilter.builderId })
      res.status(200).json({
        message: 'Attendance marked successfully',
        builderContext: req.builderFilter,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

export default router;
