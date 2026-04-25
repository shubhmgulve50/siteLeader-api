import mongoose from 'mongoose';

const materialLogSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: false, // Optional for Purchases (Stock In)
    },
    type: {
      type: String,
      required: true,
      enum: ['In', 'Out'], // In = Purchase/Stock In, Out = Consumption/Issued to Site
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      trim: true,
    },

    // Issue-slip fields (populated when type === 'Out')
    issueSlipNumber: { type: String, default: '', trim: true },
    issuedTo: { type: String, default: '', trim: true }, // Receiver (contractor/mistri/supervisor)
    purpose: { type: String, default: '', trim: true }, // Work purpose (e.g. "Slab casting — Block A")

    // Purchase-reference fields (populated when type === 'In')
    vendorName: { type: String, default: '', trim: true },
    invoiceReference: { type: String, default: '', trim: true },

    // Inter-site transfer fields (populated for transfer logs only)
    transferId: { type: String, default: '', trim: true, index: true },
    transferPeerSiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },

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
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MaterialLog = mongoose.model('MaterialLog', materialLogSchema);

export default MaterialLog;
