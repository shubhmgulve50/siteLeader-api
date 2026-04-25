import mongoose from 'mongoose';

const siteDocumentSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: '',
    },
    size: {
      // bytes
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: [
        'DRAWING',
        'CONTRACT',
        'APPROVAL',
        'INVOICE',
        'PHOTO',
        'REPORT',
        'OTHER',
      ],
      default: 'OTHER',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

siteDocumentSchema.index({ siteId: 1, category: 1, createdAt: -1 });

const SiteDocument = mongoose.model('SiteDocument', siteDocumentSchema);

export default SiteDocument;
