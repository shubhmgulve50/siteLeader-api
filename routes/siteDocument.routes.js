import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import { builderScope } from '../middleware/builder.middleware.js';
import { ROLE } from '../constants/constants.js';
import { upload } from '../utils/file_upload.js';

const router = express.Router();

router.use(authMiddleware);
router.use(builderScope);

router.get(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { getSiteDocuments } = await import('../controllers/siteDocument.controller.js');
    return getSiteDocuments(req, res, next);
  }
);
router.post(
  '/',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  upload.single('file'),
  async (req, res, next) => {
    const { uploadSiteDocument } = await import('../controllers/siteDocument.controller.js');
    return uploadSiteDocument(req, res, next);
  }
);
router.put(
  '/:id',
  allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER, ROLE.SUPERVISOR, ROLE.ENGINEER),
  async (req, res, next) => {
    const { updateSiteDocument } = await import('../controllers/siteDocument.controller.js');
    return updateSiteDocument(req, res, next);
  }
);
router.delete('/:id', allowRoles(ROLE.SUPER_ADMIN, ROLE.BUILDER), async (req, res, next) => {
  const { deleteSiteDocument } = await import('../controllers/siteDocument.controller.js');
  return deleteSiteDocument(req, res, next);
});

export default router;
