const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Tube', 'Valve', 'Alloy wheel', 'Wheel cover', 'Balancing weight', 'Puncture kit', 'Other'],
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    purchasePricePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    mrpPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstPercent: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Accessory', accessorySchema);
