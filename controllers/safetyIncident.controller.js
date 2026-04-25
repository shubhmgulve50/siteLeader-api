import SafetyIncident from '../models/safetyIncident.model.js';
import { uploadFile } from '../utils/file_upload.js';

const generateIncidentNumber = async (builderId) => {
  const count = await SafetyIncident.countDocuments({ builderId });
  const yy = new Date().getFullYear().toString().slice(-2);
  return `INC-${yy}-${(count + 1).toString().padStart(4, '0')}`;
};

// @route   POST /api/safety-incidents
export const createIncident = async (req, res) => {
  try {
    const { siteId, description } = req.body;
    if (!siteId || !description) {
      return res.status(400).json({ message: 'siteId and description are required' });
    }

    const builderId = req.user.builderId || req.user._id;
    const incidentNumber = await generateIncidentNumber(builderId);

    let images = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      images = await Promise.all(
        req.files.map((f) => uploadFile(f, `safetyIncidents/${siteId}`))
      );
    } else if (Array.isArray(req.body.images)) {
      images = req.body.images;
    }

    const incident = await SafetyIncident.create({
      ...req.body,
      images,
      incidentNumber,
      builderId,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/safety-incidents?siteId=&severity=&status=
export const getIncidents = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.siteId) query.siteId = req.query.siteId;
    if (req.query.severity) query.severity = req.query.severity;
    if (req.query.status) query.status = req.query.status;
    const incidents = await SafetyIncident.find(query)
      .populate('siteId', 'name')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    const stats = incidents.reduce(
      (acc, i) => {
        acc.total += 1;
        if (i.severity === 'NEAR_MISS') acc.nearMiss += 1;
        if (['MEDICAL', 'LOST_TIME', 'FATAL'].includes(i.severity)) acc.recordable += 1;
        acc.lostDays += Number(i.lostDays) || 0;
        if (i.status === 'OPEN' || i.status === 'INVESTIGATING') acc.open += 1;
        return acc;
      },
      { total: 0, nearMiss: 0, recordable: 0, lostDays: 0, open: 0 }
    );
    res.status(200).json({ success: true, count: incidents.length, stats, data: incidents });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/safety-incidents/:id
export const updateIncident = async (req, res) => {
  try {
    const incident = await SafetyIncident.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/safety-incidents/:id
export const deleteIncident = async (req, res) => {
  try {
    const incident = await SafetyIncident.findOneAndDelete({
      _id: req.params.id,
      ...req.builderFilter,
    });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
