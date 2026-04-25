import mongoose from 'mongoose';

const siteLabourSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignments
siteLabourSchema.index({ siteId: 1, labourId: 1 }, { unique: true });

const SiteLabour = mongoose.model('SiteLabour', siteLabourSchema);

export default SiteLabour;
