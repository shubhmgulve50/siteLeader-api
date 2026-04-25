import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['Income', 'Expense'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      // Examples: Client Payment, Material Cost, Labour Wage, Fuel, Office Rent, etc.
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: false, // Optional if it's a general expense (like office rent)
    },
    description: {
      type: String,
      trim: true,
    },
    // Receipt / supporting document images (CloudFront URLs). Up to 5.
    receiptUrls: [
      {
        type: String,
      },
    ],
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank', 'Cheque', 'Other'],
      default: 'Cash',
    },
    // Approval workflow (only Expense transactions above threshold need approval)
    approvalStatus: {
      type: String,
      enum: ['AUTO_APPROVED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'AUTO_APPROVED',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '', trim: true },
    date: {
      type: Date,
      default: Date.now,
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
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
