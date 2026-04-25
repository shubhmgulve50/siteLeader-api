import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  hsnCode: { type: String, default: '', trim: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, required: true, default: 'Nos' },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 }, // qty * rate
  notes: { type: String, default: '', trim: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['TAX_INVOICE', 'PROFORMA'],
      default: 'TAX_INVOICE',
    },

    // Parties
    clientName: { type: String, required: true, trim: true },
    clientAddress: { type: String, default: '', trim: true },
    clientGstin: { type: String, default: '', trim: true },
    clientEmail: { type: String, default: '', trim: true },
    clientPhone: { type: String, default: '', trim: true },
    placeOfSupply: { type: String, default: '', trim: true },

    // Links
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },

    // Line items
    items: [invoiceItemSchema],

    // Totals
    subTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },

    // GST
    gstType: {
      type: String,
      enum: ['NONE', 'CGST_SGST', 'IGST'],
      default: 'CGST_SGST',
    },
    cgstPercentage: { type: Number, default: 0 },
    sgstPercentage: { type: Number, default: 0 },
    igstPercentage: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    // Grand total with optional rounding
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    // Payment tracking
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
    },

    // Dates
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },

    // Free-form
    notes: { type: String, default: '', trim: true },
    termsConditions: { type: String, default: '', trim: true },

    // Tenancy
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
