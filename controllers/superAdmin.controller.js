import User from '../models/user.model.js';
import { ROLE, VERIFICATION_STATUS, MODULES } from '../constants/constants.js';
import { sendApprovalEmail, sendDenialEmail, sendEmailVerification } from '../services/email.service.js';

// GET /super-admin/builders?verificationStatus=PENDING&page=1&limit=20
export const getBuilders = async (req, res) => {
  try {
    const { verificationStatus, page = 1, limit = 20, search } = req.query;

    const filter = { role: ROLE.BUILDER };
    if (verificationStatus) {
      if (verificationStatus === VERIFICATION_STATUS.PENDING) {
        filter.verificationStatus = { $in: [VERIFICATION_STATUS.PENDING, null] };
      } else {
        filter.verificationStatus = verificationStatus;
      }
    }
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [builders, total] = await Promise.all([
      User.find(filter).select('-password -emailVerificationToken').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      message: 'Builders fetched',
      data: { builders, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /super-admin/builders/:id
export const getBuilderById = async (req, res) => {
  try {
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER }).select('-password -emailVerificationToken');
    if (!builder) return res.status(404).json({ message: 'Builder not found' });
    res.status(200).json({ message: 'Builder fetched', data: builder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /super-admin/builders/:id/approve
export const approveBuilder = async (req, res) => {
  try {
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });

    builder.verificationStatus = VERIFICATION_STATUS.APPROVED;
    await builder.save();

    Promise.allSettled([sendApprovalEmail(builder)]).catch(() => {});

    res.status(200).json({ message: 'Builder approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /super-admin/builders/:id/deny
export const denyBuilder = async (req, res) => {
  try {
    const { reason } = req.body;
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });

    builder.verificationStatus = VERIFICATION_STATUS.DENIED;
    await builder.save();

    Promise.allSettled([sendDenialEmail(builder, reason)]).catch(() => {});

    res.status(200).json({ message: 'Builder denied' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /super-admin/builders/:id/suspend
export const suspendBuilder = async (req, res) => {
  try {
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });
    if (builder.verificationStatus === VERIFICATION_STATUS.SUSPENDED) {
      return res.status(400).json({ message: 'Builder already suspended' });
    }

    builder.verificationStatus = VERIFICATION_STATUS.SUSPENDED;
    await builder.save();

    res.status(200).json({ message: 'Builder suspended' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /super-admin/builders/:id/reinstate
export const reinstateBuilder = async (req, res) => {
  try {
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });
    if (builder.verificationStatus === VERIFICATION_STATUS.APPROVED) {
      return res.status(400).json({ message: 'Builder is already active' });
    }

    builder.verificationStatus = VERIFICATION_STATUS.APPROVED;
    await builder.save();

    Promise.allSettled([sendApprovalEmail(builder)]).catch(() => {});

    res.status(200).json({ message: 'Builder reinstated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /super-admin/builders/:id/permissions
// body: { permissions: ['materials', 'finance', ...] }
export const setBuilderPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions must be an array' });
    }

    const validModules = Object.values(MODULES);
    const invalid = permissions.filter((p) => !validModules.includes(p));
    if (invalid.length > 0) {
      return res.status(400).json({ message: `Invalid modules: ${invalid.join(', ')}` });
    }

    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });
    if (builder.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
      return res.status(400).json({ message: 'Builder must be approved before assigning permissions' });
    }

    builder.permissions = permissions;
    await builder.save();

    res.status(200).json({ message: 'Permissions updated', data: { permissions: builder.permissions } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /super-admin/builders/:id/verify-email — manual email verification override
export const verifyBuilderEmail = async (req, res) => {
  try {
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });

    if (builder.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    builder.emailVerified = true;
    builder.emailVerificationToken = null;
    await builder.save();

    res.status(200).json({ message: 'Email manually verified' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /super-admin/builders/:id
export const deleteBuilder = async (req, res) => {
  try {
    const builder = await User.findOne({ _id: req.params.id, role: ROLE.BUILDER });
    if (!builder) return res.status(404).json({ message: 'Builder not found' });

    await User.deleteOne({ _id: builder._id });
    // Also remove all team members of this builder
    await User.deleteMany({ builderId: builder._id });

    res.status(200).json({ message: 'Builder and team members deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
