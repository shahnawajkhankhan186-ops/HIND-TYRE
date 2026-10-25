const mongoose = require('mongoose');
const { z } = require('zod');
const stockService = require('../services/stock.service');
const StockMovement = require('../models/StockMovement');
const auditService = require('../services/audit.service');

const stockInSchema = z.object({
  itemType: z.enum(['Tyre', 'Accessory']).default('Tyre'),
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  purchasePricePaise: z.number().int().min(0).optional(),
  supplier: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

const stockAdjustSchema = z.object({
  itemType: z.enum(['Tyre', 'Accessory']).default('Tyre'),
  itemId: z.string().min(1, 'Item ID is required'),
  newQuantity: z.number().int().min(0, 'Quantity cannot be negative'),
  note: z.string().min(3, 'A valid reason for manual adjustment is required'),
});

/**
 * Handle Stock In (Purchase Entry) inside a transaction
 */
async function stockIn(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = stockInSchema.parse(req.body);

    const result = await stockService.recordStockIn({
      itemType: data.itemType,
      itemId: data.itemId,
      quantity: data.quantity,
      purchasePricePaise: data.purchasePricePaise,
      supplier: data.supplier,
      session,
      user: req.user,
      note: data.note,
    });

    await auditService.log({
      action: 'STOCK_IN',
      entity: data.itemType,
      entityId: data.itemId,
      afterSnapshot: {
        addedQty: data.quantity,
        newStock: result.qtyAfter,
        supplier: data.supplier,
      },
      req,
      user: req.user,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Successfully stocked in ${data.quantity} units.`,
      data: result,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

/**
 * Handle Manual Stock Adjustment with mandatory reason
 */
async function stockAdjust(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = stockAdjustSchema.parse(req.body);

    const result = await stockService.recordAdjustment({
      itemType: data.itemType,
      itemId: data.itemId,
      newQuantity: data.newQuantity,
      session,
      user: req.user,
      note: data.note,
    });

    await auditService.log({
      action: 'STOCK_ADJUSTMENT',
      entity: data.itemType,
      entityId: data.itemId,
      afterSnapshot: {
        adjustedTo: data.newQuantity,
        reason: data.note,
      },
      req,
      user: req.user,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Stock adjusted to ${data.newQuantity} units.`,
      data: result,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

/**
 * Get Stock Ledger (Movement History)
 */
async function getStockLedger(req, res, next) {
  try {
    const {
      page = 1,
      limit = 25,
      type,
      itemType,
      itemId,
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (itemType) query.itemType = itemType;
    if (itemId) query.itemId = itemId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('createdBy', 'name email')
        .populate('itemId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      StockMovement.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        movements,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  stockIn,
  stockAdjust,
  getStockLedger,
};
