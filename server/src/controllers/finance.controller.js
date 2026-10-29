const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const User = require('../models/User');
const { getISTDateRange } = require('../utils/ist-date');

/**
 * Build in-memory lookup map of item cost / actualPricePaise
 */
async function getItemPriceMap() {
  const [tyres, accessories] = await Promise.all([
    Tyre.find({}, '_id actualPricePaise purchasePricePaise').lean(),
    Accessory.find({}, '_id purchasePricePaise').lean(),
  ]);

  const map = new Map();
  for (const t of tyres) {
    const cost = t.actualPricePaise !== undefined && t.actualPricePaise !== null && t.actualPricePaise > 0
      ? t.actualPricePaise
      : (t.purchasePricePaise || 0);
    map.set(String(t._id), cost);
  }
  for (const a of accessories) {
    map.set(String(a._id), a.purchasePricePaise || 0);
  }
  return map;
}

/**
 * Calculate single sale financials (Revenue, Actual Cost, Profit)
 */
function calculateSaleProfit(sale, itemPriceMap) {
  if (sale.status === 'CANCELLED') {
    return {
      revenuePaise: 0,
      costPaise: 0,
      profitPaise: 0,
      marginPercent: 0,
      items: [],
    };
  }

  let totalCostPaise = 0;
  const enrichedItems = (sale.items || []).map((it) => {
    const qty = it.qty || 1;
    const unitSellingPaise = it.unitPricePaise || 0;
    const lineSellingPaise = it.lineTotalPaise || (unitSellingPaise * qty);

    let unitActualPricePaise = 0;
    if (it.actualPricePaise !== undefined && it.actualPricePaise !== null && it.actualPricePaise > 0) {
      unitActualPricePaise = it.actualPricePaise;
    } else if (it.itemId && itemPriceMap.has(String(it.itemId))) {
      unitActualPricePaise = itemPriceMap.get(String(it.itemId));
    }

    const lineCostPaise = unitActualPricePaise * qty;
    const lineProfitPaise = lineSellingPaise - lineCostPaise;
    totalCostPaise += lineCostPaise;

    return {
      name: it.name,
      company: it.company,
      size: it.size,
      qty,
      unitPricePaise: unitSellingPaise,
      actualPricePaise: unitActualPricePaise,
      lineSellingPaise,
      lineTotalPaise: it.lineTotalPaise || lineSellingPaise,
      lineCostPaise,
      lineProfitPaise,
    };
  });

  const revenuePaise = sale.totalPaise || 0;
  const profitPaise = revenuePaise - totalCostPaise;
  const marginPercent = revenuePaise > 0 ? Number(((profitPaise / revenuePaise) * 100).toFixed(1)) : 0;

  return {
    revenuePaise,
    costPaise: totalCostPaise,
    profitPaise,
    marginPercent,
    items: enrichedItems,
  };
}

/**
 * GET /api/admin/finance/overview
 * Top stats: Total Revenue, Today Revenue, Total Profit, Today Profit, Cashier Performance
 */
async function getFinanceOverview(req, res, next) {
  try {
    const todayRange = getISTDateRange('today');
    const yesterdayRange = getISTDateRange('yesterday');
    const thisMonthRange = getISTDateRange('this_month');

    const [allCompletedSales, todayCompletedSales, users, itemPriceMap] = await Promise.all([
      Sale.find({ status: 'COMPLETED' }).lean(),
      todayRange ? Sale.find({ status: 'COMPLETED', createdAt: { $gte: todayRange.start, $lte: todayRange.end } }).lean() : [],
      User.find({ role: { $in: ['ADMIN', 'COUNTER'] } }, '_id name email role').lean(),
      getItemPriceMap(),
    ]);

    // 1. Lifetime Totals
    let totalRevenuePaise = 0;
    let totalCostPaise = 0;
    let totalProfitPaise = 0;

    for (const s of allCompletedSales) {
      const calc = calculateSaleProfit(s, itemPriceMap);
      totalRevenuePaise += calc.revenuePaise;
      totalCostPaise += calc.costPaise;
      totalProfitPaise += calc.profitPaise;
    }

    const totalMarginPercent = totalRevenuePaise > 0
      ? Number(((totalProfitPaise / totalRevenuePaise) * 100).toFixed(1))
      : 0;

    // 2. Today Totals
    let todayRevenuePaise = 0;
    let todayCostPaise = 0;
    let todayProfitPaise = 0;

    for (const s of todayCompletedSales) {
      const calc = calculateSaleProfit(s, itemPriceMap);
      todayRevenuePaise += calc.revenuePaise;
      todayCostPaise += calc.costPaise;
      todayProfitPaise += calc.profitPaise;
    }

    const todayMarginPercent = todayRevenuePaise > 0
      ? Number(((todayProfitPaise / todayRevenuePaise) * 100).toFixed(1))
      : 0;

    // 3. Cashier Breakdown
    const cashierMap = new Map();

    // Initialize all staff accounts from users collection
    for (const u of users) {
      cashierMap.set(String(u._id), {
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalInvoices: 0,
        totalRevenuePaise: 0,
        totalCostPaise: 0,
        totalProfitPaise: 0,
        todayInvoices: 0,
        todayRevenuePaise: 0,
        todayCostPaise: 0,
        todayProfitPaise: 0,
      });
    }

    // Aggregate lifetime sales per cashier
    for (const s of allCompletedSales) {
      const uId = s.soldBy?.userId ? String(s.soldBy.userId) : null;
      const email = s.soldBy?.email || 'Unknown';
      let entry = uId ? cashierMap.get(uId) : null;

      if (!entry) {
        // Fallback matching by email if userId not found
        for (const val of cashierMap.values()) {
          if (val.email && val.email.toLowerCase() === email.toLowerCase()) {
            entry = val;
            break;
          }
        }
      }

      if (!entry) {
        // Cashier not in user table (or legacy)
        entry = {
          userId: uId || email,
          name: s.soldBy?.name || email,
          email,
          role: 'COUNTER',
          totalInvoices: 0,
          totalRevenuePaise: 0,
          totalCostPaise: 0,
          totalProfitPaise: 0,
          todayInvoices: 0,
          todayRevenuePaise: 0,
          todayCostPaise: 0,
          todayProfitPaise: 0,
        };
        cashierMap.set(uId || email, entry);
      }

      const calc = calculateSaleProfit(s, itemPriceMap);
      entry.totalInvoices += 1;
      entry.totalRevenuePaise += calc.revenuePaise;
      entry.totalCostPaise += calc.costPaise;
      entry.totalProfitPaise += calc.profitPaise;
    }

    // Aggregate today's sales per cashier
    for (const s of todayCompletedSales) {
      const uId = s.soldBy?.userId ? String(s.soldBy.userId) : null;
      const email = s.soldBy?.email || 'Unknown';
      let entry = uId ? cashierMap.get(uId) : null;

      if (!entry) {
        for (const val of cashierMap.values()) {
          if (val.email && val.email.toLowerCase() === email.toLowerCase()) {
            entry = val;
            break;
          }
        }
      }

      if (entry) {
        const calc = calculateSaleProfit(s, itemPriceMap);
        entry.todayInvoices += 1;
        entry.todayRevenuePaise += calc.revenuePaise;
        entry.todayCostPaise += calc.costPaise;
        entry.todayProfitPaise += calc.profitPaise;
      }
    }

    const cashiers = Array.from(cashierMap.values()).map((c) => ({
      ...c,
      marginPercent: c.totalRevenuePaise > 0
        ? Number(((c.totalProfitPaise / c.totalRevenuePaise) * 100).toFixed(1))
        : 0,
      todayMarginPercent: c.todayRevenuePaise > 0
        ? Number(((c.todayProfitPaise / c.todayRevenuePaise) * 100).toFixed(1))
        : 0,
    })).sort((a, b) => b.totalRevenuePaise - a.totalRevenuePaise);

    res.json({
      success: true,
      data: {
        totalRevenuePaise,
        totalCostPaise,
        totalProfitPaise,
        totalInvoicesCount: allCompletedSales.length,
        totalMarginPercent,

        todayRevenuePaise,
        todayCostPaise,
        todayProfitPaise,
        todayInvoicesCount: todayCompletedSales.length,
        todayMarginPercent,

        cashiers,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/finance/transactions
 * Detailed sales transactions with profit breakdown per sale & pagination
 */
async function getFinanceTransactions(req, res, next) {
  try {
    const {
      page = 1,
      limit = 15,
      date = 'all',
      startDate,
      endDate,
      cashierId,
      paymentMode,
      status,
      search = '',
    } = req.query;

    const conditions = [];

    if (status) {
      conditions.push({ status });
    }

    if (paymentMode) {
      conditions.push({ paymentMode });
    }

    if (cashierId) {
      if (mongoose.Types.ObjectId.isValid(cashierId)) {
        conditions.push({
          $or: [
            { 'soldBy.userId': new mongoose.Types.ObjectId(cashierId) },
            { 'soldBy.email': cashierId },
          ],
        });
      } else {
        conditions.push({ 'soldBy.email': cashierId });
      }
    }

    if (date !== 'all') {
      const range = getISTDateRange(date);
      if (range) {
        conditions.push({ createdAt: { $gte: range.start, $lte: range.end } });
      }
    } else if (startDate && endDate) {
      conditions.push({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      });
    }

    if (search.trim()) {
      const s = search.trim();
      conditions.push({
        $or: [
          { invoiceNo: { $regex: s, $options: 'i' } },
          { 'customerSnapshot.name': { $regex: s, $options: 'i' } },
          { 'customerSnapshot.phone': { $regex: s, $options: 'i' } },
          { 'customerSnapshot.vehicleNumber': { $regex: s, $options: 'i' } },
          { 'soldBy.name': { $regex: s, $options: 'i' } },
          { 'soldBy.email': { $regex: s, $options: 'i' } },
          { 'items.name': { $regex: s, $options: 'i' } },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [sales, totalCount, itemPriceMap] = await Promise.all([
      Sale.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Sale.countDocuments(query),
      getItemPriceMap(),
    ]);

    // Calculate profit for each transaction
    const transactions = sales.map((sale) => {
      const calc = calculateSaleProfit(sale, itemPriceMap);
      return {
        _id: sale._id,
        invoiceNo: sale.invoiceNo,
        createdAt: sale.createdAt,
        status: sale.status,
        paymentMode: sale.paymentMode,
        paymentStatus: sale.paymentStatus,
        discountPaise: sale.discountPaise || 0,
        subtotalPaise: sale.subtotalPaise || 0,
        totalPaise: sale.totalPaise || 0,
        costPaise: calc.costPaise,
        profitPaise: calc.profitPaise,
        marginPercent: calc.marginPercent,
        customer: sale.customerSnapshot || {},
        customerSnapshot: sale.customerSnapshot || {},
        soldBy: sale.soldBy || {},
        items: calc.items,
      };
    });

    // Summary of current filtered query (across all matched records, not just this page)
    const allMatching = await Sale.find(query).select('status totalPaise items').lean();
    let filteredRevenuePaise = 0;
    let filteredCostPaise = 0;
    let filteredProfitPaise = 0;
    let completedCount = 0;

    for (const m of allMatching) {
      if (m.status === 'COMPLETED') {
        const c = calculateSaleProfit(m, itemPriceMap);
        filteredRevenuePaise += c.revenuePaise;
        filteredCostPaise += c.costPaise;
        filteredProfitPaise += c.profitPaise;
        completedCount++;
      }
    }

    const filteredMarginPercent = filteredRevenuePaise > 0
      ? Number(((filteredProfitPaise / filteredRevenuePaise) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit, 10)) || 1,
        },
        filteredSummary: {
          revenuePaise: filteredRevenuePaise,
          costPaise: filteredCostPaise,
          profitPaise: filteredProfitPaise,
          marginPercent: filteredMarginPercent,
          completedCount,
          totalCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFinanceOverview,
  getFinanceTransactions,
};

