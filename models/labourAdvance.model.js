import mongoose from 'mongoose';

const labourAdvanceSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank', 'Cheque', 'Other'],
      default: 'Cash',
    },
    note: {
      type: String,
      default: '',
      trim: true,
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

labourAdvanceSchema.index({ labourId: 1, date: -1 });
labourAdvanceSchema.index({ siteId: 1, date: -1 });

const LabourAdvance = mongoose.model('LabourAdvance', labourAdvanceSchema);

export default LabourAdvance;
