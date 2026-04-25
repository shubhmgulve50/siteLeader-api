import RaBill from '../models/raBill.model.js';
import Quotation from '../models/quotation.model.js';

const generateRaNumber = async (builderId, siteId) => {
  const count = await RaBill.countDocuments({ builderId, siteId });
  const yy = new Date().getFullYear().toString().slice(-2);
  return `RA-${yy}-${(count + 1).toString().padStart(3, '0')}`;
};

// Compute per-item cumulative / previous / current + amounts
const processItem = (it) => {
  const rate = Number(it.rate) || 0;
  const cumulativeQty = Number(it.cumulativeQty) || 0;
  const previousCumulativeQty = Number(it.previousCumulativeQty) || 0;
  const currentQty = Math.max(0, cumulativeQty - previousCumulativeQty);
  return {
    ...it,
    rate,
    cumulativeQty,
    previousCumulativeQty,
    currentQty,
    cumulativeAmount: cumulativeQty * rate,
    previousAmount: previousCumulativeQty * rate,
    currentAmount: currentQty * rate,
  };
};

const computeTotals = (body) => {
  const {
    items = [],
    retentionPercentage,
    mobilizationAdjustment,
    securityDepositAmount,
    otherDeductions,
    gstType,
    cgstPercentage,
    sgstPercentage,
    igstPercentage,
    tdsPercentage,
  } = body;

  let cumulativeGrossValue = 0;
  let previouslyBilled = 0;
  let thisBillGross = 0;

  const processedItems = items.map((it) => {
    const p = processItem(it);
    cumulativeGrossValue += p.cumulativeAmount;
    previouslyBilled += p.previousAmount;
    thisBillGross += p.currentAmount;
    return p;
  });

  const retentionAmount = (thisBillGross * (Number(retentionPercentage) || 0)) / 100;
  const mobRecovery = Number(mobilizationAdjustment) || 0;
  const sd = Number(securityDepositAmount) || 0;
  const other = Number(otherDeductions) || 0;

  const taxableAmount = Math.max(0, thisBillGross - retentionAmount - mobRecovery - sd - other);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (gstType === 'CGST_SGST') {
    cgstAmount = (taxableAmount * (Number(cgstPercentage) || 0)) / 100;
    sgstAmount = (taxableAmount * (Number(sgstPercentage) || 0)) / 100;
  } else if (gstType === 'IGST') {
    igstAmount = (taxableAmount * (Number(igstPercentage) || 0)) / 100;
  }
  const taxAmount = cgstAmount + sgstAmount + igstAmount;

  const grossBeforeTds = taxableAmount + taxAmount;
  const tdsAmount = (grossBeforeTds * (Number(tdsPercentage) || 0)) / 100;
  const totalAmount = Math.max(0, grossBeforeTds - tdsAmount);

  return {
    items: processedItems,
    cumulativeGrossValue,
    previouslyBilled,
    thisBillGross,
    retentionAmount,
    mobilizationAdjustment: mobRecovery,
    securityDepositAmount: sd,
    otherDeductions: other,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    tdsAmount,
    totalAmount,
  };
};

// @route   POST /api/ra-bills
export const createRaBill = async (req, res) => {
  try {
    const totals = computeTotals(req.body);
    const builderId = req.user.builderId || req.user._id;
    const raNumber = req.body.raNumber || (await generateRaNumber(builderId, req.body.siteId));

    // Auto-sequence per site
    const raSequence = await RaBill.countDocuments({ builderId, siteId: req.body.siteId }) + 1;

    const bill = await RaBill.create({
      ...req.body,
      ...totals,
      raNumber,
      raSequence,
      builderId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/ra-bills
export const getRaBills = async (req, res) => {
  try {
    const bills = await RaBill.find({ ...req.builderFilter })
      .populate('siteId', 'name')
      .populate('quotationId', 'quotationNumber')
      .sort({ issueDate: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: bills.length, data: bills });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/ra-bills/:id
export const getRaBillById = async (req, res) => {
  try {
    const bill = await RaBill.findOne({ _id: req.params.id, ...req.builderFilter })
      .populate('siteId', 'name address')
      .populate('quotationId', 'quotationNumber items');
    if (!bill) return res.status(404).json({ message: 'RA Bill not found' });
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/ra-bills/:id
export const updateRaBill = async (req, res) => {
  try {
    const update = { ...req.body };
    if (Array.isArray(update.items)) {
      Object.assign(update, computeTotals(update));
    }
    const bill = await RaBill.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      update,
      { new: true, runValidators: true }
    );
    if (!bill) return res.status(404).json({ message: 'RA Bill not found' });
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/ra-bills/:id
export const deleteRaBill = async (req, res) => {
  try {
    const bill = await RaBill.findOneAndDelete({ _id: req.params.id, ...req.builderFilter });
    if (!bill) return res.status(404).json({ message: 'RA Bill not found' });
    res.status(200).json({ success: true, message: 'RA Bill deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/ra-bills/seed?quotationId=xxx&siteId=yyy
// Returns items pre-populated from quotation + previous cumulative qty summed across prior RAs
export const seedRaBill = async (req, res) => {
  try {
    const { quotationId, siteId } = req.query;
    if (!siteId) return res.status(400).json({ message: 'siteId is required' });

    let baseItems = [];
    if (quotationId) {
      const quote = await Quotation.findOne({ _id: quotationId, ...req.builderFilter });
      if (!quote) return res.status(404).json({ message: 'Quotation not found' });
      baseItems = quote.items.map((qi) => ({
        description: qi.description,
        itemNumber: qi.itemNumber || '',
        unit: qi.unit,
        contractQty: qi.quantity,
        rate: qi.rate,
        previousCumulativeQty: 0,
        cumulativeQty: 0,
        currentQty: 0,
        cumulativeAmount: 0,
        previousAmount: 0,
        currentAmount: 0,
        hsnCode: qi.hsnCode || '',
      }));
    }

    // Sum previous cumulative qty per description from all prior RAs for this site
    const priorBills = await RaBill.find({ siteId, ...req.builderFilter });
    if (priorBills.length && baseItems.length) {
      baseItems = baseItems.map((bi) => {
        let prior = 0;
        priorBills.forEach((pb) => {
          const match = pb.items.find((i) => i.description === bi.description);
          if (match) prior += Number(match.cumulativeQty) || 0;
        });
        return { ...bi, previousCumulativeQty: prior };
      });
    }

    res.status(200).json({ success: true, data: { items: baseItems, priorBillsCount: priorBills.length } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
