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

    // 4. Top Selling Brands & Sizes (for Pie / Bar Charts)
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
      // 7-day daily sales trend for Line Chart
      Sale.aggregate([
        {
          $match: {
            status: 'COMPLETED',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            salesPaise: { $sum: '$totalPaise' },
            invoices: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // 5. Recent Sales
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
          dailyTrend: dailyTrend.map(d => ({
            date: d._id,
            salesPaise: d.salesPaise,
            invoices: d.invoices,
          })),
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
