const mongoose = require('mongoose');
const { z } = require('zod');
const stockService = require('../services/stock.service');
const StockMovement = require('../models/StockMovement');
const auditService = require('../services/audit.service');

const stockInSchema = z.object({
  itemType: z.enum(['Tyre', 'Accessory']).default('Tyre'),
  itemId: z.string().min(1, 'Item ID is required'),
  godown: z.enum(['G1', 'G2'], {
    errorMap: () => ({ message: 'Godown (G1 or G2) is required for stock-in' }),
  }).default('G1'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  purchasePricePaise: z.number().int().min(0).optional(),
  supplier: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

const stockAdjustSchema = z
  .object({
    itemType: z.enum(['Tyre', 'Accessory']).default('Tyre'),
    itemId: z.string().min(1, 'Item ID is required'),
    godown: z.enum(['G1', 'G2'], {
      errorMap: () => ({ message: 'Godown (G1 or G2) is required for stock adjustment' }),
    }).default('G1'),
    newQuantity: z.number().int().min(0, 'Quantity cannot be negative').optional(),
    newGodownStock: z.number().int().min(0, 'Quantity cannot be negative').optional(),
    note: z.string().optional(),
    reason: z.string().optional(),
  })
  .transform((val) => ({
    ...val,
    newQuantity: val.newQuantity !== undefined ? val.newQuantity : val.newGodownStock,
    note: val.note || val.reason || '',
  }))
  .refine((val) => val.newQuantity !== undefined && val.newQuantity >= 0, {
    message: 'newQuantity or newGodownStock is required and cannot be negative',
  })
  .refine((val) => val.note && val.note.length >= 3, {
    message: 'A valid reason for manual adjustment is required (at least 3 characters)',
  });

const stockTransferSchema = z.object({
  itemType: z.enum(['Tyre', 'Accessory']).default('Tyre'),
  itemId: z.string().min(1, 'Item ID is required'),
  fromGodown: z.enum(['G1', 'G2'], {
    errorMap: () => ({ message: 'Source godown must be G1 or G2' }),
  }),
  toGodown: z.enum(['G1', 'G2'], {
    errorMap: () => ({ message: 'Destination godown must be G1 or G2' }),
  }),
  quantity: z.number().int().positive('Transfer quantity must be greater than zero'),
  note: z.string().optional().default(''),
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
      godown: data.godown,
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
        godown: data.godown,
        newGodownStock: result.godownAfter,
        newTotalStock: result.qtyAfter,
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
      message: `Successfully stocked in ${data.quantity} units into ${data.godown}.`,
      data: result,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (_) {}
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
      godown: data.godown,
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
        godown: data.godown,
        adjustedTo: data.newQuantity,
        newTotalStock: result.qtyAfter,
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
      message: `Stock in ${data.godown} adjusted to ${data.newQuantity} units.`,
      data: result,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (_) {}
    session.endSession();
    next(err);
  }
}

/**
 * Handle Inter-Godown Stock Transfer inside transaction
 */
async function transferStock(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = stockTransferSchema.parse(req.body);

    const result = await stockService.transferStock({
      itemType: data.itemType,
      itemId: data.itemId,
      fromGodown: data.fromGodown,
      toGodown: data.toGodown,
      quantity: data.quantity,
      session,
      user: req.user,
      note: data.note,
    });

    await auditService.log({
      action: 'STOCK_TRANSFER',
      entity: data.itemType,
      entityId: data.itemId,
      afterSnapshot: {
        fromGodown: data.fromGodown,
        toGodown: data.toGodown,
        quantity: data.quantity,
        fromStockAfter: result.fromStockAfter,
        toStockAfter: result.toStockAfter,
        totalQuantity: result.totalQuantity,
        note: data.note,
      },
      req,
      user: req.user,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Successfully transferred ${data.quantity} units from ${data.fromGodown} to ${data.toGodown}.`,
      data: result,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (_) {}
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
      godown,
      itemType,
      itemId,
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (godown && ['G1', 'G2'].includes(godown)) query.godown = godown;
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
  transferStock,
  getStockLedger,
};
