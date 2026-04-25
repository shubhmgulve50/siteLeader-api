import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    plannedDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    weight: {
      // Percentage contribution to overall site completion (0–100)
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    progress: {
      // Completion of THIS milestone (0–100)
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      default: 'NOT_STARTED',
    },
    order: {
      type: Number,
      default: 0,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

milestoneSchema.index({ siteId: 1, order: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
