import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    workDone: {
      type: String,
      required: true,
      trim: true,
    },
    issues: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String, // URLs to images
      },
    ],
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
  {
    timestamps: true,
  }
);

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

export default DailyLog;
