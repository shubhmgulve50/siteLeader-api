import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['JCB', 'EXCAVATOR', 'CONCRETE_MIXER', 'CRANE', 'ROLLER', 'LOADER', 'TRACTOR', 'GENERATOR', 'PUMP', 'OTHER'],
      default: 'OTHER',
    },
    assetNumber: { type: String, default: '', trim: true }, // internal tag
    registrationNumber: { type: String, default: '', trim: true }, // vehicle regn if any
    ownership: {
      type: String,
      enum: ['OWNED', 'RENTED', 'LEASED'],
      default: 'OWNED',
    },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    hourlyRate: { type: Number, default: 0 },
    dailyRate: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    assignedSiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'DEPLOYED', 'MAINTENANCE', 'INACTIVE'],
      default: 'AVAILABLE',
    },
    purchaseDate: { type: Date },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    notes: { type: String, default: '' },
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

equipmentSchema.index({ builderId: 1, status: 1 });

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment;
