const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const StockMovement = require('../models/StockMovement');

/**
 * Single service responsible for all stock modifications.
 * Adheres strictly to atomic conditional updates and ledger recording.
 */
class StockService {
  /**
   * Helper to get appropriate model
   */
  _getModel(itemType) {
    if (itemType === 'Accessory') {
      return Accessory;
    }
    return Tyre;
  }

  /**
   * Deducts stock for a sale transaction.
   * Atomically checks quantity >= qty. Aborts with 409 if insufficient.
   * Writes StockMovement records.
   */
  async recordSaleDeductions({ items, session, reference, user }) {
    const movements = [];

    for (const item of items) {
      const Model = this._getModel(item.itemType);

      // Find current item to record quantityBefore
      const currentItem = await Model.findById(item.itemId).session(session);
      if (!currentItem) {
        const error = new Error(`Item ${item.name || item.itemId} not found in inventory.`);
        error.statusCode = 404;
        throw error;
      }

      const qtyToDeduct = Number(item.qty);

      // Atomic conditional update: quantity must be >= requested quantity
      const updateResult = await Model.updateOne(
        {
          _id: item.itemId,
          quantity: { $gte: qtyToDeduct },
        },
        {
          $inc: { quantity: -qtyToDeduct },
        },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        const error = new Error(`Insufficient stock for ${currentItem.modelName || currentItem.name || 'item'}. Available: ${currentItem.quantity}, requested: ${qtyToDeduct}`);
        error.statusCode = 409;
        throw error;
      }

      const qtyBefore = currentItem.quantity;
      const qtyAfter = qtyBefore - qtyToDeduct;

      const movement = new StockMovement({
        itemType: item.itemType || 'Tyre',
        itemId: item.itemId,
        type: 'SALE',
        qty: -qtyToDeduct,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        reference: reference || 'Sale',
        note: `Sold on invoice ${reference || ''}`,
        createdBy: user?._id || user?.userId,
      });

      await movement.save({ session });
      movements.push(movement);
    }

    return movements;
  }

  /**
   * Records stock-in (purchase entry).
   * Atomically increments quantity and logs StockMovement.
   */
  async recordStockIn({ itemType = 'Tyre', itemId, quantity, purchasePricePaise, supplier, session, user, note }) {
    const Model = this._getModel(itemType);
    const qtyToAdd = Number(quantity);
    if (qtyToAdd <= 0) {
      const error = new Error('Stock-in quantity must be greater than zero.');
      error.statusCode = 400;
      throw error;
    }

    const currentItem = await Model.findById(itemId).session(session);
    if (!currentItem) {
      const error = new Error('Item not found for stock-in.');
      error.statusCode = 404;
      throw error;
    }

    const updateDoc = {
      $inc: { quantity: qtyToAdd },
    };
    if (purchasePricePaise && Number(purchasePricePaise) > 0) {
      updateDoc.purchasePricePaise = Number(purchasePricePaise);
    }

    await Model.updateOne({ _id: itemId }, updateDoc, { session });

    const qtyBefore = currentItem.quantity;
    const qtyAfter = qtyBefore + qtyToAdd;

    const movement = new StockMovement({
      itemType,
      itemId,
      type: 'STOCK_IN',
      qty: qtyToAdd,
      quantityBefore: qtyBefore,
      quantityAfter: qtyAfter,
      reference: supplier ? `Supplier: ${supplier}` : 'Stock In',
      note: note || `Received from ${supplier || 'Supplier'}`,
      createdBy: user?._id || user?.userId,
    });

    await movement.save({ session });
    return { movement, currentItem, qtyAfter };
  }

  /**
   * Restores stock when a sale is cancelled.
   * Atomically increments quantity for each item and logs StockMovement.
   */
  async recordSaleCancelRestore({ sale, session, user, reason }) {
    const movements = [];

    for (const item of sale.items) {
      const Model = this._getModel(item.itemType);
      const currentItem = await Model.findById(item.itemId).session(session);

      if (currentItem) {
        const qtyToRestore = Number(item.qty);

        await Model.updateOne(
          { _id: item.itemId },
          { $inc: { quantity: qtyToRestore } },
          { session }
        );

        const qtyBefore = currentItem.quantity;
        const qtyAfter = qtyBefore + qtyToRestore;

        const movement = new StockMovement({
          itemType: item.itemType || 'Tyre',
          itemId: item.itemId,
          type: 'SALE_CANCEL',
          qty: qtyToRestore,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          reference: sale.invoiceNo,
          note: `Restored due to cancellation: ${reason || 'Sale Cancelled'}`,
          createdBy: user?._id || user?.userId,
        });

        await movement.save({ session });
        movements.push(movement);
      }
    }

    return movements;
  }

  /**
   * Manual stock adjustment with mandatory reason.
   */
  async recordAdjustment({ itemType = 'Tyre', itemId, newQuantity, session, user, note }) {
    if (!note || note.trim().length === 0) {
      const error = new Error('A reason is mandatory for manual stock adjustments.');
      error.statusCode = 400;
      throw error;
    }

    const Model = this._getModel(itemType);
    const newQty = Number(newQuantity);
    if (newQty < 0) {
      const error = new Error('Stock quantity cannot be negative.');
      error.statusCode = 400;
      throw error;
    }

    const currentItem = await Model.findById(itemId).session(session);
    if (!currentItem) {
      const error = new Error('Item not found for adjustment.');
      error.statusCode = 404;
      throw error;
    }

    const delta = newQty - currentItem.quantity;
    if (delta === 0) {
      return { unchanged: true, quantity: currentItem.quantity };
    }

    await Model.updateOne({ _id: itemId }, { quantity: newQty }, { session });

    const movement = new StockMovement({
      itemType,
      itemId,
      type: 'ADJUSTMENT',
      qty: delta,
      quantityBefore: currentItem.quantity,
      quantityAfter: newQty,
      reference: 'Manual Adjustment',
      note: note.trim(),
      createdBy: user?._id || user?.userId,
    });

    await movement.save({ session });
    return { movement, qtyBefore: currentItem.quantity, qtyAfter: newQty };
  }
}

module.exports = new StockService();
