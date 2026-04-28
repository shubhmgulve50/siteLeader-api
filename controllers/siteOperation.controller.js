import Attendance from '../models/attendance.model.js';
import DailyLog from '../models/dailyLog.model.js';
import SiteLabour from '../models/siteLabour.model.js';
import Transaction from '../models/transaction.model.js';

import { ROLE } from '../constants/constants.js';
import { uploadFile } from '../utils/file_upload.js';
import { getAdvanceTotalsByLabour } from './labourAdvance.controller.js';

// --- SITE PERFORMANCE STATS ---

export const getSiteStats = async (req, res) => {
  try {
    const { siteId } = req.params;

    const [transactions, attendanceToday, logsCount, totalLabour] = await Promise.all([
      Transaction.find({ siteId }),
      Attendance.find({ siteId, date: new Date().setHours(0, 0, 0, 0) }),
      DailyLog.countDocuments({ siteId }),
      SiteLabour.countDocuments({ siteId }),
    ]);

    const totalIncome = transactions
      .filter((t) => t.type === 'Income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'Expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const labourExpense = transactions
      .filter((t) => t.type === 'Expense' && t.category.toLowerCase().includes('labour'))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const materialExpense = transactions
      .filter((t) => t.type === 'Expense' && t.category.toLowerCase().includes('material'))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const presentLabourToday = attendanceToday.filter(
      (a) => a.status === 'Present' || a.status === 'Half Day'
    ).length;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        labourExpense,
        materialExpense,
        balance: totalIncome - totalExpense,
        presentLabourToday,
        totalLabourAssigned: totalLabour,
        logsCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- SITE LABOUR ASSIGNMENT ---

export const assignLabourToSite = async (req, res) => {
  try {
    const { siteId, labourId } = req.body;
    const builderId = req.user.role === ROLE.BUILDER
      ? req.user._id
      : req.user.role === ROLE.SUPER_ADMIN
        ? req.body.builderId
        : req.user.builderId;

    if (!siteId || !labourId) {
      return res.status(400).json({ message: 'Site ID and Labour ID are required' });
    }

    const assignment = await SiteLabour.create({
      siteId,
      labourId,
      builderId,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Labour already assigned to this site' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSiteLabour = async (req, res) => {
  try {
    const { siteId } = req.params;
    const assignments = await SiteLabour.find({ siteId }).populate('labourId');
    const labours = assignments.map((a) => a.labourId);
    res.status(200).json({ success: true, data: labours });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- ATTENDANCE ---

export const markAttendance = async (req, res) => {
  try {
    const { siteId, attendanceData } = req.body; // attendanceData: [{ labourId, status, notes, date }]
    const builderId = req.user.role === ROLE.BUILDER
      ? req.user._id
      : req.user.role === ROLE.SUPER_ADMIN
        ? req.body.builderId
        : req.user.builderId;
    const markedBy = req.user._id;

    if (!siteId || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: 'Invalid attendance data' });
    }

    const results = await Promise.all(
      attendanceData.map(async (record) => {
        return await Attendance.findOneAndUpdate(
          {
            siteId,
            labourId: record.labourId,
            date: new Date(record.date || new Date().setHours(0, 0, 0, 0)),
          },
          {
            status: record.status,
            notes: record.notes,
            builderId,
            markedBy,
          },
          { upsert: true, new: true }
        );
      })
    );

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSiteAttendance = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { date } = req.query;
    const queryDate = new Date(date || new Date().setHours(0, 0, 0, 0));

    const attendance = await Attendance.find({
      siteId,
      date: queryDate,
    }).populate('labourId');

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLabourAttendanceSummary = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { month, year, allTime } = req.query;

    let query = { siteId };
    let rangeFrom;
    let rangeTo;

    if (allTime !== 'true') {
      const now = new Date();
      const qMonth = month ? parseInt(month) - 1 : now.getMonth();
      const qYear = year ? parseInt(year) : now.getFullYear();
      rangeFrom = new Date(qYear, qMonth, 1);
      rangeTo = new Date(qYear, qMonth + 1, 0, 23, 59, 59);
      query.date = { $gte: rangeFrom, $lte: rangeTo };
    }

    const attendance = await Attendance.find(query).populate('labourId', 'name type dailyWage');

    // Aggregate by labour
    const summaryMap = {};
    attendance.forEach((record) => {
      const labourId = record.labourId?._id;
      if (!labourId) return;

      if (!summaryMap[labourId]) {
        summaryMap[labourId] = {
          labour: record.labourId,
          present: 0,
          absent: 0,
          halfDay: 0,
          totalDays: 0,
          earnings: 0,
          advance: 0,
          balance: 0,
        };
      }

      const wage = record.labourId.dailyWage || 0;
      if (record.status === 'Present') {
        summaryMap[labourId].present++;
        summaryMap[labourId].earnings += wage;
      } else if (record.status === 'Absent') {
        summaryMap[labourId].absent++;
      } else if (record.status === 'Half Day') {
        summaryMap[labourId].halfDay++;
        summaryMap[labourId].earnings += wage / 2;
      }
      summaryMap[labourId].totalDays++;
    });

    // Join advance totals scoped to this site + date range
    const builderId = req.user.builderId || req.user._id;
    const advanceMap = await getAdvanceTotalsByLabour({
      builderId,
      siteId,
      from: rangeFrom,
      to: rangeTo,
    });
    Object.keys(summaryMap).forEach((k) => {
      const adv = advanceMap[k] || 0;
      summaryMap[k].advance = adv;
      summaryMap[k].balance = summaryMap[k].earnings - adv;
    });

    res.status(200).json({ success: true, data: Object.values(summaryMap) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/sites/:siteId/labour/:labourId/calendar?year=&month=
// Returns daily attendance array for the labour on this site for the given month
export const getLabourAttendanceCalendar = async (req, res) => {
  try {
    const { siteId, labourId } = req.params;
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const records = await Attendance.find({
      siteId,
      labourId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Map by day-of-month
    const byDay = {};
    records.forEach((r) => {
      const d = new Date(r.date);
      byDay[d.getDate()] = r.status;
    });

    const daysInMonth = end.getDate();
    const calendar = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      calendar.push({
        day,
        date: new Date(year, month, day).toISOString(),
        status: byDay[day] || null,
      });
    }

    const summary = records.reduce(
      (acc, r) => {
        if (r.status === 'Present') acc.present += 1;
        else if (r.status === 'Half Day') acc.halfDay += 1;
        else if (r.status === 'Absent') acc.absent += 1;
        return acc;
      },
      { present: 0, halfDay: 0, absent: 0 }
    );

    res.status(200).json({
      success: true,
      year,
      month: month + 1,
      daysInMonth,
      firstDayOfWeek: start.getDay(),
      summary,
      data: calendar,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- DAILY LOGS (DPR) ---

export const createDailyLog = async (req, res) => {
  try {
    const { siteId, workDone, issues, date } = req.body;
    const builderId = req.user.role === ROLE.BUILDER
      ? req.user._id
      : req.user.role === ROLE.SUPER_ADMIN
        ? req.body.builderId
        : req.user.builderId;
    const createdBy = req.user._id;

    if (!siteId || !workDone) {
      return res.status(400).json({ message: 'Site ID and Work Done are required' });
    }

    let images = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((f) => uploadFile(f, `dailyLogs/${siteId}`))
      );
      images = uploads;
    } else if (Array.isArray(req.body.images)) {
      images = req.body.images;
    } else if (typeof req.body.images === 'string' && req.body.images) {
      images = [req.body.images];
    }

    const log = await DailyLog.create({
      siteId,
      workDone,
      issues,
      images,
      date: date || new Date(),
      builderId,
      createdBy,
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSiteLogs = async (req, res) => {
  try {
    const { siteId } = req.params;
    const logs = await DailyLog.find({ siteId }).sort({ date: -1 }).populate('createdBy', 'name');
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
