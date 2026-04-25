import User from '../models/user.model.js';
import generateToken from '../utils/jwt.js';
import { ROLE, VERIFICATION_STATUS } from '../constants/constants.js';
import { clearAuthCookies, setCookie } from '../utils/utils.js';
import {
  sendEmailVerification,
  sendBuilderRegistrationNotice,
} from '../services/email.service.js';

// Public — builder self-registration
export const builderRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      name,
      email,
      password,
      role: ROLE.BUILDER,
      builderId: null,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      emailVerified: false,
    });

    await user.save();

    // Fire-and-forget emails
    Promise.allSettled([
      sendEmailVerification(user),
      sendBuilderRegistrationNotice(user),
    ]).catch(() => {});

    res.status(201).json({
      message: 'Registration successful. Check your email to verify your account.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public — builder clicks email verification link
export const verifyEmail = async (req, res) => {
  try {
    const { token, uid } = req.body;

    if (!token || !uid) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (user.emailVerificationToken !== token) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.status(200).json({ message: 'Email verified. Await admin approval to login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public — resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, role: ROLE.BUILDER });
    if (!user) {
      return res.status(404).json({ message: 'Builder not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    await sendEmailVerification(user);

    res.status(200).json({ message: 'Verification email resent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Protected — SUPER_ADMIN or BUILDER creates team members
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let builderId = null;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (req.user.role === ROLE.SUPER_ADMIN) {
      if (role !== ROLE.BUILDER) {
        return res.status(403).json({ message: 'SUPER_ADMIN can only create BUILDERs via this route' });
      }
      builderId = null;
    } else if (req.user.role === ROLE.BUILDER) {
      if (![ROLE.SUPERVISOR, ROLE.ENGINEER, ROLE.WORKER].includes(role)) {
        return res.status(403).json({ message: 'BUILDER can only create SUPERVISOR, ENGINEER, or WORKER' });
      }
      builderId = req.user._id;
    } else {
      return res.status(403).json({ message: 'You are not allowed to create users' });
    }

    const userData = { name, email, password, role, builderId };

    if (role === ROLE.BUILDER) {
      userData.verificationStatus = VERIFICATION_STATUS.PENDING;
      userData.emailVerified = false;
    }

    const user = new User(userData);
    await user.save();

    if (role === ROLE.BUILDER) {
      Promise.allSettled([sendEmailVerification(user)]).catch(() => {});
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        builderId: user.builderId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // BUILDER-specific verification gates
    if (user.role === ROLE.BUILDER) {
      if (!user.emailVerified) {
        return res.status(403).json({
          message: 'Email not verified. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }

      switch (user.verificationStatus) {
        case null:
        case VERIFICATION_STATUS.PENDING:
          return res.status(403).json({
            message: 'Account pending admin approval. You will be notified once approved.',
            code: 'PENDING_APPROVAL',
          });
        case VERIFICATION_STATUS.DENIED:
          return res.status(403).json({
            message: 'Account registration was denied. Contact support.',
            code: 'ACCOUNT_DENIED',
          });
        case VERIFICATION_STATUS.SUSPENDED:
          return res.status(403).json({
            message: 'Account has been suspended. Contact support.',
            code: 'ACCOUNT_SUSPENDED',
          });
        case VERIFICATION_STATUS.APPROVED:
          break;
        default:
          return res.status(403).json({ message: 'Account not approved', code: 'NOT_APPROVED' });
      }
    }

    const token = generateToken(res, user._id, user.role, user.builderId);

    setCookie(res, 'accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        builderId: user.builderId,
        permissions: user.permissions,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = (req, res) => {
  clearAuthCookies(res);
  res.status(200).json({ message: 'Logged out successfully' });
};
