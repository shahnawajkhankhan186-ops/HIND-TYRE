const Sale = require('../models/Sale');
const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const { formatIST } = require('../utils/ist-date');
const { formatRupees, paiseToRupees } = require('../utils/currency');

/**
 * Helper to escape CSV fields
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Get Report Data (JSON)
 */
async function getReport(req, res, next) {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    if (type === 'sales') {
      const sales = await Sale.find({
        status: 'COMPLETED',
        ...dateFilter,
      }).sort({ createdAt: -1 });

      return res.json({ success: true, data: sales });
    }

    if (type === 'valuation') {
      const tyres = await Tyre.find({ isArchived: false, isActive: true })
        .populate('companyId', 'name')
        .sort({ quantity: -1 });

      const accessories = await Accessory.find({ isArchived: false, isActive: true })
        .sort({ quantity: -1 });

      return res.json({ success: true, data: { tyres, accessories } });
    }

    if (type === 'low-stock') {
      const tyres = await Tyre.find({
        isArchived: false,
        isActive: true,
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      }).populate('companyId', 'name');

      const accessories = await Accessory.find({
        isArchived: false,
        isActive: true,
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      });

      return res.json({ success: true, data: { tyres, accessories } });
    }

    if (type === 'company-sales') {
      const companySales = await Sale.aggregate([
        { $match: { status: 'COMPLETED', ...dateFilter } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.company',
            totalQty: { $sum: '$items.qty' },
            revenuePaise: { $sum: '$items.lineTotalPaise' },
            invoiceCount: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            company: '$_id',
            totalQty: 1,
            revenuePaise: 1,
            invoices: { $size: '$invoiceCount' },
          },
        },
        { $sort: { revenuePaise: -1 } },
      ]);

      return res.json({ success: true, data: companySales });
    }

    if (type === 'profit') {
      // Aggregate profit per completed sale item
      const profitData = await Sale.aggregate([
        { $match: { status: 'COMPLETED', ...dateFilter } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'tyres',
            localField: 'items.itemId',
            foreignField: '_id',
            as: 'tyreDoc',
          },
        },
        {
          $lookup: {
            from: 'accessories',
            localField: 'items.itemId',
            foreignField: '_id',
            as: 'accDoc',
          },
        },
        {
          $project: {
            invoiceNo: 1,
            createdAt: 1,
            itemName: '$items.name',
            company: '$items.company',
            size: '$items.size',
            qty: '$items.qty',
            unitSellingPricePaise: '$items.unitPricePaise',
            unitPurchasePricePaise: {
              $ifNull: [
                { $arrayElemAt: ['$tyreDoc.purchasePricePaise', 0] },
                { $ifNull: [{ $arrayElemAt: ['$accDoc.purchasePricePaise', 0] }, 0] },
              ],
            },
            lineRevenuePaise: '$items.lineTotalPaise',
          },
        },
        {
          $addFields: {
            lineCostPaise: { $multiply: ['$qty', '$unitPurchasePricePaise'] },
            grossProfitPaise: {
              $subtract: [
                { $multiply: ['$qty', '$unitSellingPricePaise'] },
                { $multiply: ['$qty', '$unitPurchasePricePaise'] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.json({ success: true, data: profitData });
    }

    return res.status(400).json({ success: false, error: 'Unknown report type' });
  } catch (err) {
    next(err);
  }
}

/**
 * Stream Report as CSV
 */
async function exportReportCSV(req, res, next) {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const filename = `hind_tyres_${type}_report_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (type === 'sales') {
      res.write('Invoice No,Date,Customer Name,Phone,Payment Mode,Item Name,Size,Godown,Quantity,Line Total (INR),Invoice Total (INR)\n');
      const cursor = Sale.find({ status: 'COMPLETED', ...dateFilter }).sort({ createdAt: -1 }).cursor();
      for await (const sale of cursor) {
        for (const item of sale.items) {
          const godownCode = item.godown?.code || item.godown || 'G1';
          const row = [
            escapeCSV(sale.invoiceNo),
            escapeCSV(formatIST(sale.createdAt)),
            escapeCSV(sale.customerSnapshot.name),
            escapeCSV(sale.customerSnapshot.phone),
            escapeCSV(sale.paymentMode),
            escapeCSV(item.name),
            escapeCSV(item.size || '-'),
            escapeCSV(godownCode),
            item.qty,
            paiseToRupees(item.lineTotalPaise),
            paiseToRupees(sale.totalPaise),
          ].join(',');
          res.write(row + '\n');
        }
      }
      return res.end();
    }

    if (type === 'valuation') {
      res.write('Type,Brand/Category,Model/Name,Size,SKU,Godown 1 (G1),Godown 2 (G2),Total Quantity,Purchase Rate (INR),Selling Rate (INR),Purchase Valuation (INR),Selling Valuation (INR)\n');
      const tyres = await Tyre.find({ isArchived: false, isActive: true }).populate('companyId', 'name');
      for (const t of tyres) {
        const g1 = t.godownStock?.G1 || 0;
        const g2 = t.godownStock?.G2 || 0;
        const row = [
          'Tyre',
          escapeCSV(t.companyId?.name || 'Tyre'),
          escapeCSV(t.modelName),
          escapeCSV(t.size),
          escapeCSV(t.sku),
          g1,
          g2,
          t.quantity,
          paiseToRupees(t.purchasePricePaise),
          paiseToRupees(t.sellingPricePaise),
          paiseToRupees(t.quantity * t.purchasePricePaise),
          paiseToRupees(t.quantity * t.sellingPricePaise),
        ].join(',');
        res.write(row + '\n');
      }

      const accessories = await Accessory.find({ isArchived: false, isActive: true });
      for (const a of accessories) {
        const g1 = a.godownStock?.G1 || 0;
        const g2 = a.godownStock?.G2 || 0;
        const row = [
          'Accessory',
          escapeCSV(a.category),
          escapeCSV(a.name),
          '-',
          escapeCSV(a.sku),
          g1,
          g2,
          a.quantity,
          paiseToRupees(a.purchasePricePaise),
          paiseToRupees(a.sellingPricePaise),
          paiseToRupees(a.quantity * a.purchasePricePaise),
          paiseToRupees(a.quantity * a.sellingPricePaise),
        ].join(',');
        res.write(row + '\n');
      }
      return res.end();
    }

    if (type === 'low-stock') {
      res.write('Type,Brand/Category,Item Name,Size,SKU,Godown 1 (G1),Godown 2 (G2),Total Stock,Threshold,Status\n');
      const tyres = await Tyre.find({
        isArchived: false,
        isActive: true,
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      }).populate('companyId', 'name');

      for (const t of tyres) {
        const g1 = t.godownStock?.G1 || 0;
        const g2 = t.godownStock?.G2 || 0;
        const row = [
          'Tyre',
          escapeCSV(t.companyId?.name || 'Tyre'),
          escapeCSV(t.modelName),
          escapeCSV(t.size),
          escapeCSV(t.sku),
          g1,
          g2,
          t.quantity,
          t.lowStockThreshold,
          t.quantity <= 0 ? 'Out of Stock' : 'Low Stock',
        ].join(',');
        res.write(row + '\n');
      }

      const accessories = await Accessory.find({
        isArchived: false,
        isActive: true,
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      });

      for (const a of accessories) {
        const g1 = a.godownStock?.G1 || 0;
        const g2 = a.godownStock?.G2 || 0;
        const row = [
          'Accessory',
          escapeCSV(a.category),
          escapeCSV(a.name),
          '-',
          escapeCSV(a.sku),
          g1,
          g2,
          a.quantity,
          a.lowStockThreshold,
          a.quantity <= 0 ? 'Out of Stock' : 'Low Stock',
        ].join(',');
        res.write(row + '\n');
      }
      return res.end();
    }

    if (type === 'company-sales') {
      res.write('Company,Units Sold,Revenue (INR)\n');
      const companySales = await Sale.aggregate([
        { $match: { status: 'COMPLETED', ...dateFilter } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.company',
            totalQty: { $sum: '$items.qty' },
            revenuePaise: { $sum: '$items.lineTotalPaise' },
          },
        },
        { $sort: { revenuePaise: -1 } },
      ]);

      for (const item of companySales) {
        const row = [
          escapeCSV(item._id || 'Other'),
          item.totalQty,
          paiseToRupees(item.revenuePaise),
        ].join(',');
        res.write(row + '\n');
      }
      return res.end();
    }

    if (type === 'profit') {
      res.write('Invoice No,Date,Item,Size,Qty,Selling Price (INR),Purchase Price (INR),Gross Profit (INR)\n');
      const profitData = await Sale.aggregate([
        { $match: { status: 'COMPLETED', ...dateFilter } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'tyres',
            localField: 'items.itemId',
            foreignField: '_id',
            as: 'tyreDoc',
          },
        },
        {
          $lookup: {
            from: 'accessories',
            localField: 'items.itemId',
            foreignField: '_id',
            as: 'accDoc',
          },
        },
        {
          $project: {
            invoiceNo: 1,
            createdAt: 1,
            itemName: '$items.name',
            size: '$items.size',
            qty: '$items.qty',
            unitSellingPricePaise: '$items.unitPricePaise',
            unitPurchasePricePaise: {
              $ifNull: [
                { $arrayElemAt: ['$tyreDoc.purchasePricePaise', 0] },
                { $ifNull: [{ $arrayElemAt: ['$accDoc.purchasePricePaise', 0] }, 0] },
              ],
            },
          },
        },
        {
          $addFields: {
            grossProfitPaise: {
              $subtract: [
                { $multiply: ['$qty', '$unitSellingPricePaise'] },
                { $multiply: ['$qty', '$unitPurchasePricePaise'] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      for (const p of profitData) {
        const row = [
          escapeCSV(p.invoiceNo),
          escapeCSV(formatIST(p.createdAt)),
          escapeCSV(p.itemName),
          escapeCSV(p.size),
          p.qty,
          paiseToRupees(p.unitSellingPricePaise),
          paiseToRupees(p.unitPurchasePricePaise),
          paiseToRupees(p.grossProfitPaise),
        ].join(',');
        res.write(row + '\n');
      }
      return res.end();
    }

    res.status(400).send('Invalid report type');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReport,
  exportReportCSV,
};
