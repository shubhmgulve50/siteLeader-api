import mongoose from 'mongoose';

// Per-BOQ-item running-account entry
const raItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  itemNumber: { type: String, default: '', trim: true },
  unit: { type: String, default: 'Nos' },
  contractQty: { type: Number, default: 0 },            // Total qty per contract
  rate: { type: Number, default: 0 },                   // Contract rate
  previousCumulativeQty: { type: Number, default: 0 },  // From prior RA bills
  cumulativeQty: { type: Number, default: 0 },          // Executed up to this RA
  currentQty: { type: Number, default: 0 },             // = cumulative − previous
  cumulativeAmount: { type: Number, default: 0 },       // cumulative × rate
  previousAmount: { type: Number, default: 0 },         // previousCumulative × rate
  currentAmount: { type: Number, default: 0 },          // current × rate (this period value)
  hsnCode: { type: String, default: '' },
});

const raBillSchema = new mongoose.Schema(
  {
    raNumber: { type: String, required: true, unique: true }, // e.g. RA-2601-001
    raSequence: { type: Number, default: 1 },                 // 1, 2, 3 for a project

    // Parties
    clientName: { type: String, required: true, trim: true },
    clientAddress: { type: String, default: '', trim: true },
    clientGstin: { type: String, default: '', trim: true },

    // Links
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },

    // Line items
    items: [raItemSchema],

    // Running account totals
    cumulativeGrossValue: { type: Number, default: 0 },  // Σ cumulativeAmount
    previouslyBilled: { type: Number, default: 0 },      // Σ previousAmount
    thisBillGross: { type: Number, default: 0 },         // = cumulativeGross − previouslyBilled

    // Deductions (Indian standard)
    retentionPercentage: { type: Number, default: 0 },
    retentionAmount: { type: Number, default: 0 },
    mobilizationAdjustment: { type: Number, default: 0 },  // recovery from mobilisation advance
    securityDepositAmount: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    otherDeductionsNote: { type: String, default: '' },

    taxableAmount: { type: Number, default: 0 },          // After deductions, before tax

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

    tdsPercentage: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },

    totalAmount: { type: Number, default: 0 },            // Net payable this RA

    issueDate: { type: Date, default: Date.now },
    periodFrom: { type: Date },
    periodTo: { type: Date },

    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'CERTIFIED', 'PAID'],
      default: 'DRAFT',
    },

    notes: { type: String, default: '' },

    builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const RaBill = mongoose.model('RaBill', raBillSchema);

export default RaBill;
