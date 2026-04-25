import mongoose from 'mongoose';

const safetyIncidentSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    incidentNumber: { type: String, default: '', trim: true },
    severity: {
      type: String,
      enum: ['NEAR_MISS', 'FIRST_AID', 'MEDICAL', 'LOST_TIME', 'FATAL'],
      default: 'NEAR_MISS',
    },
    category: {
      type: String,
      enum: ['FALL', 'STRUCK_BY', 'ELECTRICAL', 'FIRE', 'CHEMICAL', 'MACHINERY', 'HEAT_STROKE', 'OTHER'],
      default: 'OTHER',
    },
    date: { type: Date, default: Date.now, required: true },
    location: { type: String, default: '', trim: true }, // e.g. "2nd floor, east wing"
    personInvolved: { type: String, default: '', trim: true },
    personRole: { type: String, default: '', trim: true }, // e.g. Mason, Helper
    description: { type: String, required: true, trim: true },
    immediateAction: { type: String, default: '', trim: true },
    rootCause: { type: String, default: '', trim: true },
    correctiveAction: { type: String, default: '', trim: true },
    reportedBy: { type: String, default: '', trim: true },
    images: [{ type: String }], // CloudFront URLs
    lostDays: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
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

safetyIncidentSchema.index({ siteId: 1, date: -1 });

const SafetyIncident = mongoose.model('SafetyIncident', safetyIncidentSchema);

export default SafetyIncident;
