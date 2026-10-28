const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const StockMovement = require('../models/StockMovement');
const ShopSettings = require('../models/ShopSettings');
const { isValidGodown, getGodownName } = require('../config/godowns');

/**
 * Single service responsible for all stock modifications.
 * Adheres strictly to atomic conditional updates, two-godown rules,
 * invariant (quantity === G1 + G2), and immutable ledger recording.
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
   * Deducts stock for a sale transaction from a specified godown (G1 or G2).
   * Atomically checks godownStock[godown] >= qty. Aborts with 409 if insufficient.
   * Decrements godownStock[godown] and total quantity atomically.
   * Writes StockMovement records with godown context.
   */
  async recordSaleDeductions({ items, session, reference, user }) {
    const movements = [];
    const settings = await ShopSettings.findOne().session(session);

    for (const item of items) {
      const Model = this._getModel(item.itemType);
      const godown = item.godown?.code || item.godown || 'G1';

      if (!isValidGodown(godown)) {
        const error = new Error(`Invalid godown code "${godown}". Allowed: G1, G2.`);
        error.statusCode = 400;
        throw error;
      }

      // Find current item to record before state
      const currentItem = await Model.findById(item.itemId).session(session);
      if (!currentItem) {
        const error = new Error(`Item ${item.name || item.itemId} not found in inventory.`);
        error.statusCode = 404;
        throw error;
      }

      const qtyToDeduct = Number(item.qty || item.quantity);
      if (isNaN(qtyToDeduct) || qtyToDeduct <= 0) {
        const error = new Error('Quantity to deduct must be a positive number.');
        error.statusCode = 400;
        throw error;
      }

      const godownField = `godownStock.${godown}`;

      // Atomic conditional update: godown stock must be >= requested quantity
      const updateResult = await Model.updateOne(
        {
          _id: item.itemId,
          [godownField]: { $gte: qtyToDeduct },
        },
        {
          $inc: {
            [godownField]: -qtyToDeduct,
            quantity: -qtyToDeduct,
          },
        },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        const availableInGodown = currentItem.godownStock?.[godown] || 0;
        const godownName = getGodownName(godown, settings);
        const itemName = currentItem.modelName
          ? `${currentItem.modelName} ${currentItem.size || ''}`
          : (currentItem.name || 'item');
        const error = new Error(
          `Insufficient stock in ${godownName} for ${itemName}. Available: ${availableInGodown}, requested: ${qtyToDeduct}`
        );
        error.statusCode = 409;
        throw error;
      }

      const godownBefore = currentItem.godownStock?.[godown] || 0;
      const godownAfter = godownBefore - qtyToDeduct;
      const qtyBefore = currentItem.quantity;
      const qtyAfter = qtyBefore - qtyToDeduct;

      const movement = new StockMovement({
        itemType: item.itemType || 'Tyre',
        itemId: item.itemId,
        type: 'SALE',
        godown,
        godownBefore,
        godownAfter,
        qty: -qtyToDeduct,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        reference: reference || 'Sale',
        note: `Sold from ${getGodownName(godown, settings)} on invoice ${reference || ''}`,
        createdBy: user?._id || user?.userId,
      });

      await movement.save({ session });
      movements.push(movement);
    }

    return movements;
  }

  /**
   * Records stock-in (purchase entry) into a specified godown (G1 or G2).
   * Atomically increments godownStock[godown] and total quantity.
   * Logs StockMovement.
   */
  async recordStockIn({ itemType = 'Tyre', itemId, godown = 'G1', quantity, purchasePricePaise, supplier, session, user, note }) {
    if (!isValidGodown(godown)) {
      const error = new Error(`Invalid godown code "${godown}". Allowed: G1, G2.`);
      error.statusCode = 400;
      throw error;
    }

    const Model = this._getModel(itemType);
    const qtyToAdd = Number(quantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
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

    const godownField = `godownStock.${godown}`;
    const updateDoc = {
      $inc: {
        [godownField]: qtyToAdd,
        quantity: qtyToAdd,
      },
    };
    if (purchasePricePaise && Number(purchasePricePaise) > 0) {
      updateDoc.purchasePricePaise = Number(purchasePricePaise);
    }

    await Model.updateOne({ _id: itemId }, updateDoc, { session });

    const settings = await ShopSettings.findOne().session(session);
    const godownBefore = currentItem.godownStock?.[godown] || 0;
    const godownAfter = godownBefore + qtyToAdd;
    const qtyBefore = currentItem.quantity;
    const qtyAfter = qtyBefore + qtyToAdd;

    const movement = new StockMovement({
      itemType,
      itemId,
      type: 'STOCK_IN',
      godown,
      godownBefore,
      godownAfter,
      qty: qtyToAdd,
      quantityBefore: qtyBefore,
      quantityAfter: qtyAfter,
      reference: supplier ? `Supplier: ${supplier}` : 'Stock In',
      note: note || `Received into ${getGodownName(godown, settings)} from ${supplier || 'Supplier'}`,
      createdBy: user?._id || user?.userId,
    });

    await movement.save({ session });
    return { movement, currentItem, qtyAfter, godownAfter, godown };
  }

  /**
   * Restores stock when a sale is cancelled.
   * Restores to the specific godown from which the item was originally sold.
   * Fallback to G1 for legacy sale items without godown.
   * Atomically increments godownStock[godown] and total quantity.
   */
  async recordSaleCancelRestore({ sale, session, user, reason }) {
    const movements = [];
    const settings = await ShopSettings.findOne().session(session);

    for (const item of sale.items) {
      const Model = this._getModel(item.itemType);
      const godown = item.godown?.code || item.godown || 'G1';
      const validGodown = isValidGodown(godown) ? godown : 'G1';

      const currentItem = await Model.findById(item.itemId).session(session);

      if (currentItem) {
        const qtyToRestore = Number(item.qty);
        const godownField = `godownStock.${validGodown}`;

        await Model.updateOne(
          { _id: item.itemId },
          {
            $inc: {
              [godownField]: qtyToRestore,
              quantity: qtyToRestore,
            },
          },
          { session }
        );

        const godownBefore = currentItem.godownStock?.[validGodown] || 0;
        const godownAfter = godownBefore + qtyToRestore;
        const qtyBefore = currentItem.quantity;
        const qtyAfter = qtyBefore + qtyToRestore;

        const movement = new StockMovement({
          itemType: item.itemType || 'Tyre',
          itemId: item.itemId,
          type: 'SALE_CANCEL',
          godown: validGodown,
          godownBefore,
          godownAfter,
          qty: qtyToRestore,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          reference: sale.invoiceNo,
          note: `Restored to ${getGodownName(validGodown, settings)} due to cancellation: ${reason || 'Sale Cancelled'}`,
          createdBy: user?._id || user?.userId,
        });

        await movement.save({ session });
        movements.push(movement);
      }
    }

    return movements;
  }

  /**
   * Manual stock adjustment with mandatory reason for a specific godown.
   * Updates godownStock[godown] and updates total quantity by the delta.
   */
  async recordAdjustment({ itemType = 'Tyre', itemId, godown = 'G1', newQuantity, session, user, note }) {
    if (!note || note.trim().length === 0) {
      const error = new Error('A reason is mandatory for manual stock adjustments.');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidGodown(godown)) {
      const error = new Error(`Invalid godown code "${godown}". Allowed: G1, G2.`);
      error.statusCode = 400;
      throw error;
    }

    const Model = this._getModel(itemType);
    const newQty = Number(newQuantity);
    if (isNaN(newQty) || newQty < 0) {
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

    const godownBefore = currentItem.godownStock?.[godown] || 0;
    const delta = newQty - godownBefore;

    if (delta === 0) {
      return { unchanged: true, quantity: currentItem.quantity, godownQuantity: godownBefore };
    }

    const godownField = `godownStock.${godown}`;
    await Model.updateOne(
      { _id: itemId },
      {
        $set: { [godownField]: newQty },
        $inc: { quantity: delta },
      },
      { session }
    );

    const settings = await ShopSettings.findOne().session(session);
    const qtyBefore = currentItem.quantity;
    const qtyAfter = qtyBefore + delta;

    const movement = new StockMovement({
      itemType,
      itemId,
      type: 'ADJUSTMENT',
      godown,
      godownBefore,
      godownAfter: newQty,
      qty: delta,
      quantityBefore: qtyBefore,
      quantityAfter: qtyAfter,
      reference: 'Manual Adjustment',
      note: `Adjusted in ${getGodownName(godown, settings)}: ${note.trim()}`,
      createdBy: user?._id || user?.userId,
    });

    await movement.save({ session });
    return { movement, qtyBefore, qtyAfter, godownBefore, godownAfter: newQty, godown };
  }

  /**
   * Transfer stock between Godown 1 and Godown 2.
   * Total warehouse quantity is STRICTLY UNCHANGED.
   * Atomically checks source godown has >= quantity.
   * Writes two StockMovement records (TRANSFER_OUT and TRANSFER_IN).
   */
  async transferStock({ itemType = 'Tyre', itemId, fromGodown, toGodown, quantity, session, user, note }) {
    if (!isValidGodown(fromGodown) || !isValidGodown(toGodown)) {
      const error = new Error('Invalid godown code. Allowed: G1, G2.');
      error.statusCode = 400;
      throw error;
    }

    if (fromGodown === toGodown) {
      const error = new Error('Source and destination godowns must be different.');
      error.statusCode = 400;
      throw error;
    }

    const qtyToMove = Number(quantity);
    if (isNaN(qtyToMove) || qtyToMove <= 0) {
      const error = new Error('Transfer quantity must be greater than zero.');
      error.statusCode = 400;
      throw error;
    }

    const Model = this._getModel(itemType);
    const currentItem = await Model.findById(itemId).session(session);
    if (!currentItem) {
      const error = new Error('Item not found for stock transfer.');
      error.statusCode = 404;
      throw error;
    }

    const fromField = `godownStock.${fromGodown}`;
    const toField = `godownStock.${toGodown}`;

    // Atomic conditional move: source godown must have >= qtyToMove
    const updateResult = await Model.updateOne(
      {
        _id: itemId,
        [fromField]: { $gte: qtyToMove },
      },
      {
        $inc: {
          [fromField]: -qtyToMove,
          [toField]: qtyToMove,
        },
      },
      { session }
    );

    const settings = await ShopSettings.findOne().session(session);
    const fromGodownName = getGodownName(fromGodown, settings);
    const toGodownName = getGodownName(toGodown, settings);

    if (updateResult.modifiedCount === 0) {
      const available = currentItem.godownStock?.[fromGodown] || 0;
      const itemName = currentItem.modelName
        ? `${currentItem.modelName} ${currentItem.size || ''}`
        : (currentItem.name || 'item');
      const error = new Error(
        `Insufficient stock in ${fromGodownName} for transfer. Available: ${available}, requested: ${qtyToMove}`
      );
      error.statusCode = 409;
      throw error;
    }

    const fromBefore = currentItem.godownStock?.[fromGodown] || 0;
    const fromAfter = fromBefore - qtyToMove;
    const toBefore = currentItem.godownStock?.[toGodown] || 0;
    const toAfter = toBefore + qtyToMove;
    const totalQty = currentItem.quantity; // Total remains unchanged

    const transferRef = `TRANSFER-${Date.now()}`;
    const userReason = note ? ` (${note.trim()})` : '';

    // 1. Log TRANSFER_OUT
    const outMovement = new StockMovement({
      itemType,
      itemId,
      type: 'TRANSFER_OUT',
      godown: fromGodown,
      godownBefore: fromBefore,
      godownAfter: fromAfter,
      qty: -qtyToMove,
      quantityBefore: totalQty,
      quantityAfter: totalQty,
      reference: transferRef,
      note: `Transferred to ${toGodownName}${userReason}`,
      createdBy: user?._id || user?.userId,
    });
    await outMovement.save({ session });

    // 2. Log TRANSFER_IN
    const inMovement = new StockMovement({
      itemType,
      itemId,
      type: 'TRANSFER_IN',
      godown: toGodown,
      godownBefore: toBefore,
      godownAfter: toAfter,
      qty: qtyToMove,
      quantityBefore: totalQty,
      quantityAfter: totalQty,
      reference: transferRef,
      note: `Received from ${fromGodownName}${userReason}`,
      createdBy: user?._id || user?.userId,
    });
    await inMovement.save({ session });

    return {
      itemId,
      fromGodown,
      toGodown,
      transferredQty: qtyToMove,
      fromStockAfter: fromAfter,
      toStockAfter: toAfter,
      totalQuantity: totalQty,
      movements: [outMovement, inMovement],
    };
  }
}

module.exports = new StockService();
