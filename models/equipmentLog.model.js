import mongoose from 'mongoose';

const equipmentLogSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
    },
    type: {
      type: String,
      enum: ['USAGE', 'MAINTENANCE', 'FUEL', 'ASSIGNMENT', 'UNASSIGN'],
      default: 'USAGE',
    },
    date: { type: Date, default: Date.now },
    hours: { type: Number, default: 0 },
    fuelQty: { type: Number, default: 0 }, // litres
    cost: { type: Number, default: 0 },
    operator: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
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

equipmentLogSchema.index({ equipmentId: 1, date: -1 });
equipmentLogSchema.index({ siteId: 1, date: -1 });

const EquipmentLog = mongoose.model('EquipmentLog', equipmentLogSchema);

export default EquipmentLog;
