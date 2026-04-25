import Vendor from '../models/vendor.model.js';

// @route   POST /api/vendors
export const createVendor = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const builderId = req.user.builderId || req.user._id;
    const opening = Number(req.body.openingBalance) || 0;
    const vendor = await Vendor.create({
      ...req.body,
      openingBalance: opening,
      outstandingAmount: opening,
      builderId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/vendors
export const getVendors = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.category) query.category = req.query.category;
    if (req.query.active === 'true') query.active = true;
    if (req.query.active === 'false') query.active = false;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      query.$or = [{ name: re }, { phone: re }, { gstin: re }];
    }
    const vendors = await Vendor.find(query).sort({ name: 1 });
    const totals = vendors.reduce(
      (acc, v) => {
        acc.totalOutstanding += Number(v.outstandingAmount) || 0;
        if (v.active) acc.active += 1;
        return acc;
      },
      { totalOutstanding: 0, active: 0 }
    );
    res
      .status(200)
      .json({ success: true, count: vendors.length, summary: totals, data: vendors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/vendors/:id
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/vendors/:id
export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/vendors/:id/payments
// Body: { amount, note } — records outgoing payment → reduces outstanding
export const recordVendorPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const vendor = await Vendor.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    vendor.outstandingAmount = Math.max(0, (Number(vendor.outstandingAmount) || 0) - (Number(amount) || 0));
    await vendor.save();
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/vendors/:id/bills
// Body: { amount } — records new bill → increases outstanding
export const recordVendorBill = async (req, res) => {
  try {
    const { amount } = req.body;
    const vendor = await Vendor.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    vendor.outstandingAmount = (Number(vendor.outstandingAmount) || 0) + (Number(amount) || 0);
    await vendor.save();
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/vendors/:id
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndDelete({ _id: req.params.id, ...req.builderFilter });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
