import Invoice from '../models/invoice.model.js';

const generateInvoiceNumber = async (builderId) => {
  const count = await Invoice.countDocuments({ builderId });
  const yy = new Date().getFullYear().toString().slice(-2);
  return `INV-${yy}${(count + 1).toString().padStart(4, '0')}`;
};

const processItem = (it) => {
  const qty = Number(it.quantity) || 0;
  const rate = Number(it.rate) || 0;
  return { ...it, quantity: qty, rate, amount: qty * rate };
};

const computeTotals = (body) => {
  const {
    items = [],
    gstType,
    cgstPercentage,
    sgstPercentage,
    igstPercentage,
    discountAmount,
  } = body;

  let subTotal = 0;
  const processedItems = items.map((it) => {
    const p = processItem(it);
    subTotal += p.amount;
    return p;
  });

  const discount = Number(discountAmount) || 0;
  const taxableAmount = Math.max(0, subTotal - discount);

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
  const raw = taxableAmount + taxAmount;
  const rounded = Math.round(raw);
  const roundOff = Number((rounded - raw).toFixed(2));
  const totalAmount = rounded;

  return {
    items: processedItems,
    subTotal,
    discountAmount: discount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    roundOff,
    totalAmount,
  };
};

const derivePaymentStatus = (inv) => {
  const paid = Number(inv.paidAmount) || 0;
  const total = Number(inv.totalAmount) || 0;
  if (paid >= total && total > 0) return 'PAID';
  if (paid > 0 && paid < total) return 'PARTIAL';
  if (inv.dueDate && new Date(inv.dueDate) < new Date() && paid < total) return 'OVERDUE';
  return 'UNPAID';
};

// @route   POST /api/invoices
export const createInvoice = async (req, res) => {
  try {
    const totals = computeTotals(req.body);
    const builderId = req.user.builderId || req.user._id;
    const invoiceNumber = req.body.invoiceNumber || (await generateInvoiceNumber(builderId));

    const draft = {
      ...req.body,
      ...totals,
      invoiceNumber,
      builderId,
      createdBy: req.user._id,
    };
    draft.paymentStatus = derivePaymentStatus(draft);

    const invoice = await Invoice.create(draft);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ ...req.builderFilter })
      .populate('siteId', 'name')
      .populate('quotationId', 'quotationNumber')
      .sort({ issueDate: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.builderFilter })
      .populate('siteId', 'name address')
      .populate('quotationId', 'quotationNumber');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const update = { ...req.body };
    if (Array.isArray(update.items)) {
      Object.assign(update, computeTotals(update));
    }
    update.paymentStatus = derivePaymentStatus(update);

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...req.builderFilter },
      update,
      { new: true, runValidators: true }
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/invoices/:id/payments
export const recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const inv = await Invoice.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });

    inv.paidAmount = (Number(inv.paidAmount) || 0) + (Number(amount) || 0);
    inv.paymentStatus = derivePaymentStatus(inv);
    await inv.save();
    res.status(200).json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   DELETE /api/invoices/:id
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, ...req.builderFilter });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
