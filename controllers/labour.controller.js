import Labour from '../models/labour.model.js';
import { ROLE } from '../constants/constants.js';

// @desc    Create a new labour
// @route   POST /api/labours
// @access  SUPER_ADMIN, BUILDER
export const createLabour = async (req, res) => {
  try {
    const { name, mobile, type, dailyWage } = req.body;

    if (!name || !mobile || !type || dailyWage === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const labourData = { name, mobile, type, dailyWage };

    if (req.user.role === ROLE.BUILDER) {
      labourData.builderId = req.user._id;
    } else if (req.user.role === ROLE.SUPER_ADMIN) {
      labourData.builderId = req.body.builderId || null;
    }

    const labour = await Labour.create(labourData);

    res.status(201).json({
      success: true,
      data: labour,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all labours (filtered by builderId)
// @route   GET /api/labours
// @access  SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER
export const getLabours = async (req, res) => {
  try {
    const labours = await Labour.find({ ...req.builderFilter }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: labours.length,
      data: labours,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update labour details
// @route   PUT /api/labours/:id
// @access  SUPER_ADMIN, BUILDER
export const updateLabour = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, type, dailyWage, isActive } = req.body;

    const labour = await Labour.findOne({ _id: id, ...req.builderFilter });

    if (!labour) {
      return res.status(404).json({ message: 'Labour not found or unauthorized' });
    }

    if (name) labour.name = name;
    if (mobile) labour.mobile = mobile;
    if (type) labour.type = type;
    if (dailyWage !== undefined) labour.dailyWage = dailyWage;
    if (isActive !== undefined) labour.isActive = isActive;

    await labour.save();

    res.status(200).json({
      success: true,
      data: labour,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete labour
// @route   DELETE /api/labours/:id
// @access  SUPER_ADMIN, BUILDER
export const deleteLabour = async (req, res) => {
  try {
    const { id } = req.params;

    const labour = await Labour.findOneAndDelete({ _id: id, ...req.builderFilter });

    if (!labour) {
      return res.status(404).json({ message: 'Labour not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Labour record deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
