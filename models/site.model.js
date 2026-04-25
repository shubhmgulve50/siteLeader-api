import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Required per request
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    startDate: { type: Date, required: true },
    // Optional
    clientName: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    endDate: { type: Date },
    projectType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Renovation'],
      default: 'Residential',
    },
    status: {
      type: String,
      enum: ['Not Started', 'Ongoing', 'Completed'],
      default: 'Not Started',
    },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    estimatedBudget: { type: Number },
    notes: { type: String },
    // Client portal — read-only shareable link token
    clientPortalToken: { type: String, default: '', index: true, sparse: true },
    clientPortalEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Site = mongoose.model('Site', siteSchema);

export default Site;
