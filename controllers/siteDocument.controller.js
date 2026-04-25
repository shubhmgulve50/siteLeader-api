import SiteDocument from '../models/siteDocument.model.js';
import { uploadFile, deleteFile } from '../utils/file_upload.js';

// @route   POST /api/site-documents
// multipart: `file` (required), body: siteId, category, description, name
export const uploadSiteDocument = async (req, res) => {
  try {
    const { siteId, category, description, name } = req.body;
    if (!siteId || !req.file) {
      return res.status(400).json({ message: 'siteId and file are required' });
    }

    const builderId = req.user.builderId || req.user._id;
    const url = await uploadFile(req.file, `siteDocuments/${siteId}`);

    const doc = await SiteDocument.create({
      siteId,
      name: name || req.file.originalname,
      url,
      mimeType: req.file.mimetype || '',
      size: req.file.size || 0,
      category: category || 'OTHER',
      description: description || '',
      builderId,
      uploadedBy: req.user._id,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/site-documents?siteId=&category=
export const getSiteDocuments = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.siteId) query.siteId = req.query.siteId;
    if (req.query.category) query.category = req.query.category;
    const docs = await SiteDocument.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/site-documents/:id
export const updateSiteDocument = async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const doc = await SiteDocument.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      { name, category, description },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/site-documents/:id
export const deleteSiteDocument = async (req, res) => {
  try {
    const doc = await SiteDocument.findOneAndDelete({
      _id: req.params.id,
      ...req.builderFilter,
    });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.url) await deleteFile(doc.url).catch(() => null);
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
