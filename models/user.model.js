import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE, VERIFICATION_STATUS, MODULES } from '../constants/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
      required: true,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // BUILDER-only: approval flow
    verificationStatus: {
      type: String,
      enum: [...Object.values(VERIFICATION_STATUS), null],
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    // Modules super-admin grants to this builder
    permissions: {
      type: [String],
      enum: Object.values(MODULES),
      default: [],
    },
  },
  { timestamps: true }
);

// Pre-save middleware to handle password hashing
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      // Must use await or generate salt
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
