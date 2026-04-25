import LabourAdvance from '../models/labourAdvance.model.js';

// @route   POST /api/labour-advances
export const createAdvance = async (req, res) => {
  try {
    const { labourId, siteId, amount, date, paymentMode, note } = req.body;
    if (!labourId || !amount) {
      return res.status(400).json({ message: 'labourId and amount are required' });
    }

    const builderId = req.user.builderId || req.user._id;
    const advance = await LabourAdvance.create({
      labourId,
      siteId: siteId || undefined,
      amount: Number(amount),
      date: date || new Date(),
      paymentMode: paymentMode || 'Cash',
      note,
      builderId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: advance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/labour-advances
// Query: labourId, siteId, from, to
export const getAdvances = async (req, res) => {
  try {
    const { labourId, siteId, from, to } = req.query;
    const query = { ...req.builderFilter };
    if (labourId) query.labourId = labourId;
    if (siteId) query.siteId = siteId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const advances = await LabourAdvance.find(query)
      .populate('labourId', 'name type dailyWage')
      .populate('siteId', 'name')
      .sort({ date: -1, createdAt: -1 });

    const total = advances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    res.status(200).json({ success: true, count: advances.length, total, data: advances });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/labour-advances/:id
export const deleteAdvance = async (req, res) => {
  try {
    const deleted = await LabourAdvance.findOneAndDelete({
      _id: req.params.id,
      ...req.builderFilter,
    });
    if (!deleted) return res.status(404).json({ message: 'Advance not found' });
    res.status(200).json({ success: true, message: 'Advance deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper used by payroll summary — total advances per labour in date range (optionally site-scoped)
export const getAdvanceTotalsByLabour = async ({ builderId, siteId, from, to }) => {
  const query = { builderId };
  if (siteId) query.siteId = siteId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  const rows = await LabourAdvance.find(query).select('labourId amount');
  const map = {};
  rows.forEach((r) => {
    const k = String(r.labourId);
    map[k] = (map[k] || 0) + (Number(r.amount) || 0);
  });
  return map;
};
