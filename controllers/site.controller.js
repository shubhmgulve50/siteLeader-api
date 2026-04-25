import Site from '../models/site.model.js';
import { ROLE } from '../constants/constants.js';

// @desc    Create a new site
// @route   POST /api/sites
// @access  SUPER_ADMIN, BUILDER
export const createSite = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      address,
      startDate,
      clientName,
      city,
      latitude,
      longitude,
      endDate,
      projectType,
      status,
      supervisor,
      engineer,
      priority,
      estimatedBudget,
      notes,
    } = req.body;

    if (!name || !phoneNumber || !address || !startDate) {
      return res.status(400).json({
        message: 'Name, Phone Number, Address, and Start Date are required',
      });
    }

    const siteData = {
      name,
      phoneNumber,
      address,
      startDate,
      clientName,
      city,
      latitude,
      longitude,
      endDate,
      projectType,
      status,
      supervisor: supervisor || null,
      engineer: engineer || null,
      priority,
      estimatedBudget,
      notes,
    };

    // Set builderId based on role
    if (req.user.role === ROLE.BUILDER) {
      siteData.builderId = req.user._id;
    } else if (req.user.role === ROLE.SUPER_ADMIN) {
      // If SUPER_ADMIN provides a builderId, use it; otherwise null (global)
      siteData.builderId = req.body.builderId || null;
    }

    const site = await Site.create(siteData);

    res.status(201).json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all sites (filtered by builderId via middleware)
// @route   GET /api/sites
// @access  SUPER_ADMIN, BUILDER, SUPERVISOR
export const getSites = async (req, res) => {
  try {
    // req.builderFilter is attached by builderScope middleware
    const sites = await Site.find({ ...req.builderFilter }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a site
// @route   PUT /api/sites/:id
// @access  SUPER_ADMIN, BUILDER
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Site.findOne({ _id: id, ...req.builderFilter });

    if (!site) {
      return res.status(404).json({ message: 'Site not found or unauthorized' });
    }

    const fieldsToUpdate = [
      'name',
      'phoneNumber',
      'address',
      'startDate',
      'clientName',
      'city',
      'latitude',
      'longitude',
      'endDate',
      'projectType',
      'status',
      'supervisor',
      'engineer',
      'priority',
      'estimatedBudget',
      'notes',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        site[field] =
          req.body[field] || (field === 'supervisor' || field === 'engineer' ? null : site[field]);
      }
    });

    await site.save();

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a site
// @route   DELETE /api/sites/:id
// @access  SUPER_ADMIN, BUILDER
export const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership/scope via builderFilter
    const site = await Site.findOneAndDelete({ _id: id, ...req.builderFilter });

    if (!site) {
      return res.status(404).json({ message: 'Site not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Site deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Get single site details
// @route   GET /api/sites/:id
// @access  SUPER_ADMIN, BUILDER, SUPERVISOR, ENGINEER
export const getSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Site.findOne({ _id: id, ...req.builderFilter })
      .populate('supervisor', 'name email')
      .populate('engineer', 'name email');

    if (!site) {
      return res.status(404).json({ message: 'Site not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
