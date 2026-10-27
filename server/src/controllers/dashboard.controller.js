const Sale = require('../models/Sale');
const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const { getISTDateRange } = require('../utils/ist-date');

/**
 * Get comprehensive analytics and metrics for Admin Dashboard
 */
async function getDashboardStats(req, res, next) {
  try {
    const todayRange = getISTDateRange('today');
    const monthRange = getISTDateRange('this_month');

    // 1. Parallel Aggregations for Sales Performance
    const [todaySalesAgg, monthSalesAgg, totalCompletedSales] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: todayRange.start, $lte: todayRange.end },
            status: 'COMPLETED',
          },
        },
        {
          $group: {
            _id: null,
            totalSalesPaise: { $sum: '$totalPaise' },
            invoiceCount: { $sum: 1 },
            tyresSoldCount: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      { $cond: [{ $eq: ['$$this.itemType', 'Tyre'] }, '$$this.qty', 0] },
                    ],
                  },
                },
              },
            },
          },
        },
      ]),
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: monthRange.start, $lte: monthRange.end },
            status: 'COMPLETED',
          },
        },
        {
          $group: {
            _id: null,
            totalSalesPaise: { $sum: '$totalPaise' },
            invoiceCount: { $sum: 1 },
            tyresSoldCount: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      { $cond: [{ $eq: ['$$this.itemType', 'Tyre'] }, '$$this.qty', 0] },
                    ],
                  },
                },
              },
            },
          },
        },
      ]),
      Sale.countDocuments({ status: 'COMPLETED' }),
    ]);

    const todayStats = todaySalesAgg[0] || { totalSalesPaise: 0, invoiceCount: 0, tyresSoldCount: 0 };
    const monthStats = monthSalesAgg[0] || { totalSalesPaise: 0, invoiceCount: 0, tyresSoldCount: 0 };

    // 2. Inventory Valuation (Purchase Value & Selling Value)
    const [tyreValuation, accessoryValuation] = await Promise.all([
      Tyre.aggregate([
        { $match: { isArchived: false, isActive: true } },
        {
          $group: {
            _id: null,
            totalStockQuantity: { $sum: '$quantity' },
            purchaseValuationPaise: { $sum: { $multiply: ['$quantity', '$purchasePricePaise'] } },
            sellingValuationPaise: { $sum: { $multiply: ['$quantity', '$sellingPricePaise'] } },
            lowStockCount: {
              $sum: { $cond: [{ $lte: ['$quantity', '$lowStockThreshold'] }, 1, 0] },
            },
            outOfStockCount: {
              $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] },
            },
          },
        },
      ]),
      Accessory.aggregate([
        { $match: { isArchived: false, isActive: true } },
        {
          $group: {
            _id: null,
            totalStockQuantity: { $sum: '$quantity' },
            purchaseValuationPaise: { $sum: { $multiply: ['$quantity', '$purchasePricePaise'] } },
            sellingValuationPaise: { $sum: { $multiply: ['$quantity', '$sellingPricePaise'] } },
            lowStockCount: {
              $sum: { $cond: [{ $lte: ['$quantity', '$lowStockThreshold'] }, 1, 0] },
            },
            outOfStockCount: {
              $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const tVal = tyreValuation[0] || {
      totalStockQuantity: 0,
      purchaseValuationPaise: 0,
      sellingValuationPaise: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
    const aVal = accessoryValuation[0] || {
      totalStockQuantity: 0,
      purchaseValuationPaise: 0,
      sellingValuationPaise: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    const totalStockValue = {
      purchaseValuationPaise: tVal.purchaseValuationPaise + aVal.purchaseValuationPaise,
      sellingValuationPaise: tVal.sellingValuationPaise + aVal.sellingValuationPaise,
      potentialProfitPaise:
        tVal.sellingValuationPaise +
        aVal.sellingValuationPaise -
        (tVal.purchaseValuationPaise + aVal.purchaseValuationPaise),
      totalQuantity: tVal.totalStockQuantity + aVal.totalStockQuantity,
      lowStockCount: tVal.lowStockCount + aVal.lowStockCount,
      outOfStockCount: tVal.outOfStockCount + aVal.outOfStockCount,
    };

    // 3. Low Stock Items List
    const [lowStockTyres, outOfStockTyres] = await Promise.all([
      Tyre.find({
        isArchived: false,
        isActive: true,
        $expr: {
          $and: [
            { $lte: ['$quantity', '$lowStockThreshold'] },
            { $gt: ['$quantity', 0] },
          ],
        },
      })
        .populate('companyId', 'name')
        .limit(10),
      Tyre.find({
        isArchived: false,
        isActive: true,
        quantity: { $lte: 0 },
      })
        .populate('companyId', 'name')
        .limit(10),
    ]);

    // 4. Generate continuous 10-day sequence for Daily Revenue Graph in IST
    const istOffsetMs = 330 * 60 * 1000;
    const nowUTC = new Date();
    const istNow = new Date(nowUTC.getTime() + (nowUTC.getTimezoneOffset() * 60000) + istOffsetMs);

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const last10DaysMap = new Map();
    const last10DaysList = [];

    for (let i = 9; i >= 0; i--) {
      const d = new Date(istNow);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const dayLabel = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
      const dayName = i === 0 ? 'Today' : DAY_NAMES[d.getDay()];

      const dayObj = {
        date: dateKey,
        displayDate: dayLabel,
        dayName,
        label: i === 0 ? `${dayLabel} (Today)` : dayLabel,
        salesPaise: 0,
        salesRupees: 0,
        invoices: 0,
      };
      last10DaysMap.set(dateKey, dayObj);
      last10DaysList.push(dayObj);
    }

    const startOf10DaysAgoUTC = new Date(
      Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate() - 9, 0, 0, 0, 0) - istOffsetMs
    );

    // 5. Top Selling Brands, Sizes & 10-Day Sales Trend
    const [topBrands, topSizes, dailyTrend] = await Promise.all([
      Sale.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $unwind: '$items' },
        { $match: { 'items.itemType': 'Tyre' } },
        {
          $group: {
            _id: '$items.company',
            totalQty: { $sum: '$items.qty' },
            totalRevenuePaise: { $sum: '$items.lineTotalPaise' },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 6 },
      ]),
      Sale.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $unwind: '$items' },
        { $match: { 'items.itemType': 'Tyre', 'items.size': { $ne: '-' } } },
        {
          $group: {
            _id: '$items.size',
            totalQty: { $sum: '$items.qty' },
            totalRevenuePaise: { $sum: '$items.lineTotalPaise' },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 6 },
      ]),
      // 10-day daily sales trend in IST timezone
      Sale.aggregate([
        {
          $match: {
            status: 'COMPLETED',
            createdAt: { $gte: startOf10DaysAgoUTC },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } },
            salesPaise: { $sum: '$totalPaise' },
            invoices: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Populate actual revenue into last 10 days continuous map
    dailyTrend.forEach((item) => {
      if (last10DaysMap.has(item._id)) {
        const entry = last10DaysMap.get(item._id);
        entry.salesPaise = item.salesPaise;
        entry.salesRupees = item.salesPaise / 100;
        entry.invoices = item.invoices;
      }
    });

    // 6. Recent Sales
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        today: todayStats,
        thisMonth: monthStats,
        totalCompletedSales,
        stockValue: totalStockValue,
        lowStockItems: lowStockTyres,
        outOfStockItems: outOfStockTyres,
        charts: {
          topBrands: topBrands.map(b => ({
            name: b._id || 'Unknown',
            qty: b.totalQty,
            revenuePaise: b.totalRevenuePaise,
          })),
          topSizes: topSizes.map(s => ({
            name: s._id || 'Standard',
            qty: s.totalQty,
            revenuePaise: s.totalRevenuePaise,
          })),
          dailyTrend: last10DaysList,
        },
        recentSales,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
};
