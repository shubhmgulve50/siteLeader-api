import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  // Optional grouping — items sharing sectionTitle render under one section header
  sectionTitle: { type: String, default: '', trim: true },
  // Optional Indian-PWD-style numbering (e.g. "1.1", "A.2.a")
  itemNumber: { type: String, default: '', trim: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, required: true, default: 'Units' },
  // Rate analysis breakdown (optional — all default 0). If any provided, rate is sum of these.
  materialRate: { type: Number, default: 0 },
  labourRate: { type: Number, default: 0 },
  equipmentRate: { type: Number, default: 0 },
  otherRate: { type: Number, default: 0 },
  rate: { type: Number, required: true, default: 0 }, // Final unit rate (may equal sum of above, or entered directly)
  amount: { type: Number, required: true, default: 0 }, // quantity * rate
  hsnCode: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true },
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
    },
    clientAddress: {
      type: String,
      trim: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    items: [quotationItemSchema],
    subTotal: {
      type: Number,
      default: 0,
    },
    // Legacy combined tax %. Still supported for simple quotes.
    taxPercentage: {
      type: Number,
      default: 0,
    },
    // Indian GST: CGST + SGST for intra-state, IGST for inter-state. Also supports exempt.
    gstType: {
      type: String,
      enum: ['NONE', 'CGST_SGST', 'IGST'],
      default: 'NONE',
    },
    cgstPercentage: { type: Number, default: 0 },
    sgstPercentage: { type: Number, default: 0 },
    igstPercentage: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: { type: Number, default: 0 },
    totalAmount: {
      type: Number,
      default: 0,
    },
    // Validity & version
    validUntil: { type: Date },
    revisionNumber: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Approved', 'Rejected'],
      default: 'Draft',
    },
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

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;
