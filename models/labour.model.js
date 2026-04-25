import mongoose from 'mongoose';

const labourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Mason', 'Carpenter', 'Helper', 'Electrician', 'Plumber', 'Other'],
      default: 'Helper',
    },
    dailyWage: {
      type: Number,
      required: true,
      min: 0,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for SUPER_ADMIN global entries, but usually set
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // 4-digit PIN for kiosk attendance self-clock-in
    kioskPin: {
      type: String,
      default: '',
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Labour = mongoose.model('Labour', labourSchema);

export default Labour;
