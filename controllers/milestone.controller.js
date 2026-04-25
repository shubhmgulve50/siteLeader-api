import Milestone from '../models/milestone.model.js';

// @route   POST /api/milestones
export const createMilestone = async (req, res) => {
  try {
    const { siteId, title } = req.body;
    if (!siteId || !title) {
      return res.status(400).json({ message: 'siteId and title required' });
    }
    const builderId = req.user.builderId || req.user._id;
    const count = await Milestone.countDocuments({ siteId, builderId });
    const milestone = await Milestone.create({
      ...req.body,
      order: req.body.order ?? count + 1,
      builderId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/milestones?siteId=...
export const getMilestones = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.siteId) query.siteId = req.query.siteId;
    const milestones = await Milestone.find(query).sort({ order: 1, createdAt: 1 });

    // Compute overall site progress (weighted average)
    const totalWeight = milestones.reduce((s, m) => s + (Number(m.weight) || 0), 0);
    const weightedProgress = milestones.reduce(
      (s, m) => s + (Number(m.weight) || 0) * (Number(m.progress) || 0),
      0
    );
    const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    res.status(200).json({
      success: true,
      count: milestones.length,
      overallProgress,
      data: milestones,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/milestones/:id
export const updateMilestone = async (req, res) => {
  try {
    const update = { ...req.body };

    // Auto-sync status + completedDate based on progress
    if (update.progress != null) {
      const p = Number(update.progress);
      if (p >= 100) {
        update.status = 'COMPLETED';
        update.completedDate = update.completedDate || new Date();
        update.progress = 100;
      } else if (p > 0) {
        if (update.status !== 'BLOCKED') update.status = 'IN_PROGRESS';
        update.completedDate = null;
      } else {
        if (update.status !== 'BLOCKED') update.status = 'NOT_STARTED';
        update.completedDate = null;
      }
    }

    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      update,
      { new: true, runValidators: true }
    );
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/milestones/:id
export const deleteMilestone = async (req, res) => {
  try {
    const m = await Milestone.findOneAndDelete({ _id: req.params.id, ...req.builderFilter });
    if (!m) return res.status(404).json({ message: 'Milestone not found' });
    res.status(200).json({ success: true, message: 'Milestone deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/milestones/reorder
// Body: { siteId, order: [{ _id, order }] }
export const reorderMilestones = async (req, res) => {
  try {
    const { order = [] } = req.body;
    const ops = order.map((o) => ({
      updateOne: {
        filter: { _id: o._id, ...req.builderFilter },
        update: { $set: { order: o.order } },
      },
    }));
    if (ops.length > 0) await Milestone.bulkWrite(ops);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
