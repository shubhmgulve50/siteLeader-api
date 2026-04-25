import Equipment from '../models/equipment.model.js';
import EquipmentLog from '../models/equipmentLog.model.js';

// @route   POST /api/equipment
export const createEquipment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const builderId = req.user.builderId || req.user._id;
    const equipment = await Equipment.create({
      ...req.body,
      builderId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/equipment
export const getEquipment = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.status) query.status = req.query.status;
    if (req.query.assignedSiteId) query.assignedSiteId = req.query.assignedSiteId;
    const list = await Equipment.find(query)
      .populate('assignedSiteId', 'name')
      .populate('vendorId', 'name')
      .sort({ name: 1 });
    const summary = list.reduce(
      (acc, e) => {
        acc.totalHours += Number(e.totalHours) || 0;
        if (e.status === 'DEPLOYED') acc.deployed += 1;
        if (e.status === 'AVAILABLE') acc.available += 1;
        if (e.status === 'MAINTENANCE') acc.maintenance += 1;
        return acc;
      },
      { totalHours: 0, deployed: 0, available: 0, maintenance: 0 }
    );
    res.status(200).json({ success: true, count: list.length, summary, data: list });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/equipment/:id
export const getEquipmentById = async (req, res) => {
  try {
    const eq = await Equipment.findOne({ _id: req.params.id, ...req.builderFilter })
      .populate('assignedSiteId', 'name address')
      .populate('vendorId', 'name phone');
    if (!eq) return res.status(404).json({ message: 'Equipment not found' });
    res.status(200).json({ success: true, data: eq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/equipment/:id
export const updateEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!eq) return res.status(404).json({ message: 'Equipment not found' });
    res.status(200).json({ success: true, data: eq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/equipment/:id/logs
export const addEquipmentLog = async (req, res) => {
  try {
    const { type = 'USAGE', hours, fuelQty, cost, operator, note, siteId, date } = req.body;
    const builderId = req.user.builderId || req.user._id;

    const eq = await Equipment.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!eq) return res.status(404).json({ message: 'Equipment not found' });

    const log = await EquipmentLog.create({
      equipmentId: req.params.id,
      siteId: siteId || eq.assignedSiteId || null,
      type,
      date: date || new Date(),
      hours: Number(hours) || 0,
      fuelQty: Number(fuelQty) || 0,
      cost: Number(cost) || 0,
      operator: operator || '',
      note: note || '',
      builderId,
      createdBy: req.user._id,
    });

    // Update equipment aggregate fields
    if (type === 'USAGE' && Number(hours) > 0) {
      eq.totalHours = (Number(eq.totalHours) || 0) + Number(hours);
      if (eq.status === 'AVAILABLE') eq.status = 'DEPLOYED';
    }
    if (type === 'MAINTENANCE') {
      eq.lastMaintenance = new Date();
      eq.status = 'MAINTENANCE';
    }
    if (type === 'ASSIGNMENT' && siteId) {
      eq.assignedSiteId = siteId;
      eq.status = 'DEPLOYED';
    }
    if (type === 'UNASSIGN') {
      eq.assignedSiteId = null;
      eq.status = 'AVAILABLE';
    }
    await eq.save();

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/equipment/:id/logs
export const getEquipmentLogs = async (req, res) => {
  try {
    const query = { equipmentId: req.params.id, ...req.builderFilter };
    if (req.query.siteId) query.siteId = req.query.siteId;
    const logs = await EquipmentLog.find(query)
      .populate('siteId', 'name')
      .sort({ date: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/equipment/logs?siteId=
export const getAllEquipmentLogs = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.siteId) query.siteId = req.query.siteId;
    if (req.query.equipmentId) query.equipmentId = req.query.equipmentId;
    const logs = await EquipmentLog.find(query)
      .populate('equipmentId', 'name type')
      .populate('siteId', 'name')
      .sort({ date: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/equipment/:id
export const deleteEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findOneAndDelete({ _id: req.params.id, ...req.builderFilter });
    if (!eq) return res.status(404).json({ message: 'Equipment not found' });
    res.status(200).json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
