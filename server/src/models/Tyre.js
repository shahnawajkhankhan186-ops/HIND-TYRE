const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto'],
      required: true,
      index: true,
    },
    tubeType: {
      type: String,
      enum: ['Tubeless', 'Tube-type'],
      default: 'Tubeless',
    },
    plyRating: {
      type: String,
      default: '',
    },
    loadIndex: {
      type: String,
      default: '',
    },
    speedRating: {
      type: String,
      default: '',
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
      required: true,
      min: 0,
    },
    sellingPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    mrpPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPercent: {
      type: Number,
      default: 28,
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
      default: 5,
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

module.exports = mongoose.model('Tyre', tyreSchema);
