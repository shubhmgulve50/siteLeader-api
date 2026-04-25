import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['Bags', 'Tons', 'Cu.Ft.', 'Sq.Ft.', 'Units', 'kg', 'Litre', 'Other'],
      default: 'Units',
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStock: {
      type: Number,
      default: 0, // Alert threshold
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

// Prevent duplicate material names for the same builder
materialSchema.index({ name: 1, builderId: 1 }, { unique: true });

const Material = mongoose.model('Material', materialSchema);

export default Material;
