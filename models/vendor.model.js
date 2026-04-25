import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    gstin: { type: String, default: '', trim: true, uppercase: true },
    panNumber: { type: String, default: '', trim: true, uppercase: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: ['MATERIAL', 'LABOUR_CONTRACTOR', 'EQUIPMENT', 'TRANSPORT', 'SERVICE', 'OTHER'],
      default: 'MATERIAL',
    },
    paymentTermsDays: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    notes: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
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

vendorSchema.index({ builderId: 1, name: 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
