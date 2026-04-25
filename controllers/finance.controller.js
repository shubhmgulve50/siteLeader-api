import Transaction from '../models/transaction.model.js';
import { uploadFile, deleteFile } from '../utils/file_upload.js';
import { logAudit } from '../utils/audit.js';
import { ROLE } from '../constants/constants.js';

// Approval threshold in ₹ — expenses above this require builder approval when raised by non-builders
const APPROVAL_THRESHOLD = Number(process.env.EXPENSE_APPROVAL_THRESHOLD) || 10000;

const parseReceiptInputs = async (req) => {
  // Multipart uploads take priority
  const uploaded = [];
  if (Array.isArray(req.files) && req.files.length > 0) {
    const urls = await Promise.all(
      req.files.map((f) => uploadFile(f, `receipts/${req.user.builderId || req.user._id}`))
    );
    uploaded.push(...urls);
  }

  // Pre-uploaded URLs (JSON callers or mixed payloads)
  let existing = [];
  const body = req.body.receiptUrls;
  if (Array.isArray(body)) {
    existing = body.filter(Boolean);
  } else if (typeof body === 'string' && body) {
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed)) existing = parsed.filter(Boolean);
      else existing = [body];
    } catch {
      existing = [body];
    }
  }

  return [...existing, ...uploaded];
};

// @desc    Add a new transaction (Income/Expense)
// @route   POST /api/finance
export const createTransaction = async (req, res) => {
  try {
    const { type, amount, category, siteId, description, date, paymentMode } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount and category are required' });
    }

    const receiptUrls = await parseReceiptInputs(req);
    const amt = Number(amount);
    const role = req.user.role;

    // Determine approval status: Expense > threshold from non-builders → PENDING
    let approvalStatus = 'AUTO_APPROVED';
    if (
      type === 'Expense' &&
      amt >= APPROVAL_THRESHOLD &&
      role !== ROLE.BUILDER &&
      role !== ROLE.SUPER_ADMIN
    ) {
      approvalStatus = 'PENDING';
    }

    const transaction = await Transaction.create({
      type,
      amount: amt,
      category,
      siteId: siteId || null,
      description,
      date: date || new Date(),
      paymentMode: paymentMode || 'Cash',
      receiptUrls,
      approvalStatus,
      approvedBy: approvalStatus === 'AUTO_APPROVED' ? req.user._id : undefined,
      approvedAt: approvalStatus === 'AUTO_APPROVED' ? new Date() : undefined,
      builderId: req.user.builderId || req.user._id,
      createdBy: req.user._id,
    });

    logAudit(
      req,
      'CREATE',
      'Transaction',
      transaction._id,
      `${type} ₹${amt.toLocaleString('en-IN')} — ${category}`,
      { type, amount: amt, category, approvalStatus }
    );

    res.status(201).json({
      success: true,
      data: transaction,
      needsApproval: approvalStatus === 'PENDING',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/finance/:id/approve
// @access  SUPER_ADMIN, BUILDER only
export const approveTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.approvalStatus !== 'PENDING') {
      return res.status(400).json({ message: `Already ${tx.approvalStatus}` });
    }
    tx.approvalStatus = 'APPROVED';
    tx.approvedBy = req.user._id;
    tx.approvedAt = new Date();
    tx.rejectionReason = '';
    await tx.save();
    logAudit(req, 'APPROVE', 'Transaction', tx._id, `Approved ₹${tx.amount.toLocaleString('en-IN')} ${tx.category}`);
    res.status(200).json({ success: true, data: tx });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/finance/:id/reject
// @access  SUPER_ADMIN, BUILDER only
export const rejectTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const tx = await Transaction.findOne({ _id: req.params.id, ...req.builderFilter });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.approvalStatus !== 'PENDING') {
      return res.status(400).json({ message: `Already ${tx.approvalStatus}` });
    }
    tx.approvalStatus = 'REJECTED';
    tx.approvedBy = req.user._id;
    tx.approvedAt = new Date();
    tx.rejectionReason = reason || '';
    await tx.save();
    logAudit(req, 'REJECT', 'Transaction', tx._id, `Rejected ₹${tx.amount.toLocaleString('en-IN')}${reason ? ` — ${reason}` : ''}`);
    res.status(200).json({ success: true, data: tx });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/finance/pending-approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const txs = await Transaction.find({ ...req.builderFilter, approvalStatus: 'PENDING' })
      .populate('siteId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: txs.length,
      threshold: APPROVAL_THRESHOLD,
      data: txs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all transactions (with role-based filtering)
// @route   GET /api/finance
export const getTransactions = async (req, res) => {
  try {
    const filter = { ...req.builderFilter };

    const transactions = await Transaction.find(filter)
      .populate('siteId', 'name')
      .sort({ date: -1 });

    const summary = transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'Income') acc.totalIncome += curr.amount;
        if (curr.type === 'Expense') acc.totalExpense += curr.amount;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    res.status(200).json({
      success: true,
      count: transactions.length,
      summary: {
        ...summary,
        balance: summary.totalIncome - summary.totalExpense,
      },
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a transaction (including receipts)
// @route   PUT /api/finance/:id
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, siteId, description, date, paymentMode, removeReceipt } = req.body;

    const transaction = await Transaction.findOne({ _id: id, ...req.builderFilter });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    // Handle receipt removal (optional — single URL or array)
    let retained = transaction.receiptUrls || [];
    if (removeReceipt) {
      const toRemove = Array.isArray(removeReceipt) ? removeReceipt : [removeReceipt];
      retained = retained.filter((u) => !toRemove.includes(u));
      // Delete from S3 (best-effort)
      await Promise.all(toRemove.map((u) => deleteFile(u).catch(() => null)));
    }

    // New uploads
    const uploadedNow = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      const urls = await Promise.all(
        req.files.map((f) => uploadFile(f, `receipts/${req.user.builderId || req.user._id}`))
      );
      uploadedNow.push(...urls);
    }

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category !== undefined) transaction.category = category;
    if (siteId !== undefined) transaction.siteId = siteId || null;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (paymentMode !== undefined) transaction.paymentMode = paymentMode;
    transaction.receiptUrls = [...retained, ...uploadedNow];

    await transaction.save();
    logAudit(req, 'UPDATE', 'Transaction', transaction._id, `Updated ${transaction.type} ${transaction.category}`);
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/finance/:id
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({ _id: id, ...req.builderFilter });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    // Best-effort S3 cleanup
    if (Array.isArray(transaction.receiptUrls) && transaction.receiptUrls.length > 0) {
      await Promise.all(transaction.receiptUrls.map((u) => deleteFile(u).catch(() => null)));
    }

    logAudit(
      req,
      'DELETE',
      'Transaction',
      transaction._id,
      `Deleted ${transaction.type} ₹${transaction.amount?.toLocaleString('en-IN')} ${transaction.category}`
    );

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
