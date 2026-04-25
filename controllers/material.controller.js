import Material from '../models/material.model.js';
import MaterialLog from '../models/materialLog.model.js';
import { ROLE } from '../constants/constants.js';

// @desc    Create new material in master list
// @route   POST /api/materials
// @access  SUPER_ADMIN, BUILDER
export const createMaterial = async (req, res) => {
  try {
    const { name, unit, minStock, initialStock } = req.body;
    const material = await Material.create({
      name,
      unit,
      minStock: minStock || 0,
      currentStock: initialStock || 0,
      builderId: req.user.builderId || req.user._id,
    });
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all materials
// @route   GET /api/materials
// @access  SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER
export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ ...req.builderFilter }).sort({ name: 1 });
    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate a per-builder issue-slip number for Out movements
const generateIssueSlipNumber = async (builderId) => {
  const count = await MaterialLog.countDocuments({ builderId, type: 'Out' });
  const yy = new Date().getFullYear().toString().slice(-2);
  return `ISS-${yy}-${(count + 1).toString().padStart(4, '0')}`;
};

// @desc    Log material movement (Stock In / Out)
// @route   POST /api/materials/log
// @access  SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER
export const logMaterialMovement = async (req, res) => {
  try {
    const {
      materialId,
      siteId,
      type,
      quantity,
      description,
      issuedTo,
      purpose,
      vendorName,
      invoiceReference,
    } = req.body;

    if (!materialId || !type || !quantity) {
      return res.status(400).json({ message: 'Material, type and quantity are required' });
    }

    const material = await Material.findOne({ _id: materialId, ...req.builderFilter });
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Role Security: Non-Builders can only log "Out" (Consumption)
    if (req.user.role === ROLE.SUPERVISOR || req.user.role === ROLE.ENGINEER) {
      if (type !== 'Out') {
        return res.status(403).json({ message: 'Only Builders can perform Stock In (Purchases).' });
      }
    }

    // Update Stock
    if (type === 'In') {
      material.currentStock += Number(quantity);
    } else {
      if (material.currentStock < quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock. Current: ${material.currentStock}` });
      }
      material.currentStock -= Number(quantity);
    }

    await material.save();

    const builderId = req.user.builderId || req.user._id;
    const logPayload = {
      materialId,
      siteId: siteId || null,
      type,
      quantity,
      description,
      builderId,
      createdBy: req.user._id,
    };

    if (type === 'Out') {
      logPayload.issuedTo = issuedTo || '';
      logPayload.purpose = purpose || '';
      logPayload.issueSlipNumber = await generateIssueSlipNumber(builderId);
    } else {
      logPayload.vendorName = vendorName || '';
      logPayload.invoiceReference = invoiceReference || '';
    }

    const log = await MaterialLog.create(logPayload);

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Transfer material between two sites (no net stock change)
// @route   POST /api/materials/transfer
// @access  SUPER_ADMIN, BUILDER, SUPERVISOR
export const transferMaterial = async (req, res) => {
  try {
    const { materialId, fromSiteId, toSiteId, quantity, description } = req.body;
    if (!materialId || !fromSiteId || !toSiteId || !quantity) {
      return res.status(400).json({ message: 'materialId, fromSiteId, toSiteId and quantity are required' });
    }
    if (String(fromSiteId) === String(toSiteId)) {
      return res.status(400).json({ message: 'Source and destination sites must differ' });
    }

    const material = await Material.findOne({ _id: materialId, ...req.builderFilter });
    if (!material) return res.status(404).json({ message: 'Material not found' });
    if (material.currentStock < Number(quantity)) {
      return res
        .status(400)
        .json({ message: `Insufficient global stock. Current: ${material.currentStock}` });
    }

    const builderId = req.user.builderId || req.user._id;
    const yy = new Date().getFullYear().toString().slice(-2);
    const rand = Math.random().toString(36).slice(-5).toUpperCase();
    const transferId = `TRF-${yy}-${rand}`;

    const commonExtras = {
      quantity: Number(quantity),
      description: description || `Site transfer ${transferId}`,
      transferId,
      builderId,
      createdBy: req.user._id,
    };

    // Out from source (no stock mutation — net zero for transfer)
    const outLog = await MaterialLog.create({
      materialId,
      siteId: fromSiteId,
      type: 'Out',
      issueSlipNumber: transferId,
      issuedTo: 'Site Transfer',
      purpose: `Transferred to another site`,
      transferPeerSiteId: toSiteId,
      ...commonExtras,
    });

    // In to destination
    const inLog = await MaterialLog.create({
      materialId,
      siteId: toSiteId,
      type: 'In',
      vendorName: 'Inter-site Transfer',
      invoiceReference: transferId,
      transferPeerSiteId: fromSiteId,
      ...commonExtras,
    });

    res.status(201).json({
      success: true,
      data: {
        transferId,
        outLog,
        inLog,
        material: material.name,
        quantity: Number(quantity),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single material log (for issue-slip print)
// @route   GET /api/materials/logs/:id
// @access  All
export const getMaterialLogById = async (req, res) => {
  try {
    const log = await MaterialLog.findOne({ _id: req.params.id, ...req.builderFilter })
      .populate('materialId', 'name unit')
      .populate('siteId', 'name address')
      .populate('createdBy', 'name');
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get material logs
// @route   GET /api/materials/logs
// @access  All
export const getMaterialLogs = async (req, res) => {
  try {
    const logs = await MaterialLog.find({ ...req.builderFilter })
      .populate('materialId', 'name unit')
      .populate('siteId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update material details
// @route   PUT /api/materials/:id
// @access  BUILDER, ENGINEER, SUPERVISOR
export const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      req.body,
      { new: true }
    );
    if (!material) return res.status(404).json({ message: 'Material not found' });
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  BUILDER
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findOneAndDelete({ _id: req.params.id, ...req.builderFilter });
    if (!material) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
