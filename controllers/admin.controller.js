import User from '../models/user.model.js';
import Site from '../models/site.model.js';
import Labour from '../models/labour.model.js';
import Transaction from '../models/transaction.model.js';
import Quotation from '../models/quotation.model.js';

// @desc    Get dashboard summary stats
// @route   GET /api/admin/dashboard-stats
export const getDashboardStats = async (req, res) => {
  try {
    const filter = req.builderFilter;

    const [sitesCount, laboursCount, financeData, quotations] = await Promise.all([
      Site.countDocuments(filter),
      Labour.countDocuments(filter),
      Transaction.find(filter),
      Quotation.find(filter),
    ]);

    // Calculate Finance Totals
    const totalIncome = financeData
      .filter((f) => f.type === 'Income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = financeData
      .filter((f) => f.type === 'Expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalMaterialCost = financeData
      .filter((f) => f.type === 'Expense' && f.category.toLowerCase().includes('material'))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate Quotation Totals
    const totalQuotesValue = quotations
      .filter((q) => q.status === 'Approved')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        sites: sitesCount,
        labours: laboursCount,
        finance: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense,
          materialCost: totalMaterialCost,
        },
        quotationValue: totalQuotesValue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
