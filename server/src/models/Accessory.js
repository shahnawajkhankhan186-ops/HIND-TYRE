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
    godownStock: {
      G1: {
        type: Number,
        default: 0,
        min: [0, 'Godown 1 stock cannot be negative'],
      },
      G2: {
        type: Number,
        default: 0,
        min: [0, 'Godown 2 stock cannot be negative'],
      },
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

accessorySchema.pre('validate', function (next) {
  if (!this.godownStock) {
    this.godownStock = { G1: Number(this.quantity) || 0, G2: 0 };
  } else if (
    (this.godownStock.G1 === undefined || this.godownStock.G1 === 0) &&
    (this.godownStock.G2 === undefined || this.godownStock.G2 === 0) &&
    this.quantity > 0 &&
    !this.isModified('godownStock')
  ) {
    this.godownStock.G1 = Number(this.quantity) || 0;
    this.godownStock.G2 = 0;
  }
  const g1 = Number(this.godownStock.G1) || 0;
  const g2 = Number(this.godownStock.G2) || 0;
  this.quantity = g1 + g2;
  next();
});

accessorySchema.pre('save', function (next) {
  if (this.godownStock) {
    const g1 = Number(this.godownStock.G1) || 0;
    const g2 = Number(this.godownStock.G2) || 0;
    this.quantity = g1 + g2;
  }
  next();
});

module.exports = mongoose.model('Accessory', accessorySchema);
