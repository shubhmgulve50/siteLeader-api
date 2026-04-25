import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day'],
      default: 'Present',
    },
    notes: {
      type: String,
      trim: true,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per labour per site per day
attendanceSchema.index({ siteId: 1, labourId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
