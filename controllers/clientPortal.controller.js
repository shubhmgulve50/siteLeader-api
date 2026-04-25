import crypto from 'crypto';
import Site from '../models/site.model.js';
import Milestone from '../models/milestone.model.js';
import DailyLog from '../models/dailyLog.model.js';
import SafetyIncident from '../models/safetyIncident.model.js';

const generateToken = () => crypto.randomBytes(20).toString('hex');

// @route   POST /api/sites/:id/portal
// Enable + rotate token. Returns new token.
// @access  SUPER_ADMIN, BUILDER
export const enableClientPortal = async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!site) return res.status(404).json({ message: 'Site not found' });
    site.clientPortalToken = generateToken();
    site.clientPortalEnabled = true;
    await site.save();
    res.status(200).json({ success: true, token: site.clientPortalToken, enabled: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/sites/:id/portal
// Disable portal and invalidate token
// @access  SUPER_ADMIN, BUILDER
export const disableClientPortal = async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!site) return res.status(404).json({ message: 'Site not found' });
    site.clientPortalToken = '';
    site.clientPortalEnabled = false;
    await site.save();
    res.status(200).json({ success: true, enabled: false });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/portal/:token
// Public — no auth. Returns CURATED read-only site view.
// No wages, no vendor info, no internal costs.
export const getPublicPortal = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 10) {
      return res.status(404).json({ message: 'Invalid link' });
    }
    const site = await Site.findOne({ clientPortalToken: token, clientPortalEnabled: true });
    if (!site) return res.status(404).json({ message: 'Portal not found or disabled' });

    const [milestones, recentLogs, safetyStats] = await Promise.all([
      Milestone.find({ siteId: site._id }).sort({ order: 1 }),
      DailyLog.find({ siteId: site._id }).sort({ date: -1 }).limit(10),
      SafetyIncident.find({ siteId: site._id }),
    ]);

    // Overall progress from milestones (weighted)
    const totalWeight = milestones.reduce((s, m) => s + (Number(m.weight) || 0), 0);
    const weightedProgress = milestones.reduce(
      (s, m) => s + (Number(m.weight) || 0) * (Number(m.progress) || 0),
      0
    );
    const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    // Days since last incident
    const lastIncident = safetyStats.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    const daysSafe = lastIncident
      ? Math.floor((Date.now() - new Date(lastIncident.date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Curate response — never expose financials / vendors / wages
    res.status(200).json({
      success: true,
      data: {
        site: {
          name: site.name,
          status: site.status,
          address: site.address,
          city: site.city,
          clientName: site.clientName,
          startDate: site.startDate,
          endDate: site.endDate,
          projectType: site.projectType,
          priority: site.priority,
        },
        overallProgress,
        milestones: milestones.map((m) => ({
          title: m.title,
          description: m.description,
          plannedDate: m.plannedDate,
          completedDate: m.completedDate,
          progress: m.progress,
          status: m.status,
          order: m.order,
        })),
        recentLogs: recentLogs.map((l) => ({
          date: l.date,
          workDone: l.workDone,
          images: l.images || [],
        })),
        safety: {
          daysSafe,
          totalIncidents: safetyStats.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
