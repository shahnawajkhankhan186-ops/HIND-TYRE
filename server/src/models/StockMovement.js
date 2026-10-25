const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['Tyre', 'Accessory'],
      default: 'Tyre',
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      refPath: 'itemType',
    },
    type: {
      type: String,
      enum: ['STOCK_IN', 'SALE', 'SALE_CANCEL', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);
