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
    materialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    purchasePricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    actualPricePaise: {
      type: Number,
      min: 0,
      default: function () {
        return this.purchasePricePaise ? Math.round(this.purchasePricePaise * 0.97) : 0;
      },
    },
    minSellingPricePaise: {
      type: Number,
      min: 0,
      default: function () {
        return this.actualPricePaise || this.purchasePricePaise || this.sellingPricePaise || 0;
      },
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
      default: 28,
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
    warrantyYears: {
      type: Number,
      default: 5,
    },
    expectedLifespanKm: {
      type: String,
      default: '65,000 - 80,000 KM',
    },
    qualityGrade: {
      type: String,
      default: 'A+ Ultra-Endurance Radial',
    },
    features: {
      type: [String],
      default: [
        'High-Silica Extended Mileage Compound',
        'Anti-Aquaplaning Dual Hydro Grooves',
        'Triple Steel Belt Puncture Protection',
        'Low Rolling Resistance (Fuel Saver)',
      ],
    },
    wetGripRating: {
      type: String,
      default: 'Grade A',
    },
    fuelEfficiency: {
      type: String,
      default: 'Class B',
    },
    noiseLevel: {
      type: String,
      default: '68 dB Whisper Quiet',
    },
    description: {
      type: String,
      default: 'Engineered for exceptional road endurance, superior wet braking in Indian road conditions, and prolonged tread lifespan.',
    },
  },
  {
    timestamps: true,
  }
);

tyreSchema.pre('validate', function (next) {
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

tyreSchema.pre('save', function (next) {
  if (this.godownStock) {
    const g1 = Number(this.godownStock.G1) || 0;
    const g2 = Number(this.godownStock.G2) || 0;
    this.quantity = g1 + g2;
  }
  next();
});

module.exports = mongoose.model('Tyre', tyreSchema);
