import Quotation from '../models/quotation.model.js';

// Helper to generate next quotation number
const generateQuoteNumber = async (builderId) => {
  const count = await Quotation.countDocuments({ builderId });
  const dateStr = new Date().getFullYear().toString().substr(-2);
  return `QT-${dateStr}${(count + 1).toString().padStart(4, '0')}`;
};

// Compute per-item rate + amount (honouring rate analysis breakdown)
const processItem = (item) => {
  const qty = Number(item.quantity) || 0;
  const material = Number(item.materialRate) || 0;
  const labour = Number(item.labourRate) || 0;
  const equipment = Number(item.equipmentRate) || 0;
  const other = Number(item.otherRate) || 0;
  const breakdownSum = material + labour + equipment + other;
  // If breakdown provided, rate = sum; else use explicit rate
  const rate = breakdownSum > 0 ? breakdownSum : Number(item.rate) || 0;
  const amount = qty * rate;
  return {
    ...item,
    quantity: qty,
    materialRate: material,
    labourRate: labour,
    equipmentRate: equipment,
    otherRate: other,
    rate,
    amount,
  };
};

const computeTotals = (body) => {
  const { items = [], taxPercentage, gstType, cgstPercentage, sgstPercentage, igstPercentage, discountAmount } = body;

  let subTotal = 0;
  const processedItems = items.map((it) => {
    const p = processItem(it);
    subTotal += p.amount;
    return p;
  });

  const discount = Number(discountAmount) || 0;
  const taxable = Math.max(0, subTotal - discount);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let taxAmount = 0;

  if (gstType === 'CGST_SGST') {
    cgstAmount = (taxable * (Number(cgstPercentage) || 0)) / 100;
    sgstAmount = (taxable * (Number(sgstPercentage) || 0)) / 100;
    taxAmount = cgstAmount + sgstAmount;
  } else if (gstType === 'IGST') {
    igstAmount = (taxable * (Number(igstPercentage) || 0)) / 100;
    taxAmount = igstAmount;
  } else {
    // Legacy combined tax
    taxAmount = (taxable * (Number(taxPercentage) || 0)) / 100;
  }

  const totalAmount = taxable + taxAmount;

  return {
    items: processedItems,
    subTotal,
    discountAmount: discount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    totalAmount,
  };
};

// @desc    Create new quotation
// @route   POST /api/quotations
export const createQuotation = async (req, res) => {
  try {
    const totals = computeTotals(req.body);
    const builderId = req.user.builderId || req.user._id;
    const quotationNumber = await generateQuoteNumber(builderId);

    const quotation = await Quotation.create({
      ...req.body,
      ...totals,
      quotationNumber,
      builderId,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, ...req.builderFilter })
      .populate('siteId', 'name address');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all quotations
// @route   GET /api/quotations
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ ...req.builderFilter })
      .populate('siteId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
export const updateQuotation = async (req, res) => {
  try {
    const update = { ...req.body };
    if (Array.isArray(update.items)) {
      const totals = computeTotals(update);
      Object.assign(update, totals);
    }

    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      update,
      { new: true, runValidators: true }
    );

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({
      _id: req.params.id,
      ...req.builderFilter,
    });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.status(200).json({ success: true, message: 'Quotation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
