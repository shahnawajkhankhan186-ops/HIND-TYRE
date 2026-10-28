const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['Tyre', 'Accessory'],
      default: 'Tyre',
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'items.itemType',
    },
    name: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: '',
    },
    godown: {
      code: {
        type: String,
        enum: ['G1', 'G2'],
        required: true,
        default: 'G1',
      },
      name: {
        type: String,
        default: 'Godown 1',
      },
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    actualPricePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    minSellingPricePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerSnapshot: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      vehicleNumber: { type: String, default: '' },
      vehicleModel: { type: String, default: '' },
    },
    items: {
      type: [saleItemSchema],
      validate: [val => val.length > 0, 'Sale must contain at least one item'],
    },
    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'CREDIT'],
      default: 'CASH',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING'],
      default: 'PAID',
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
      index: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelReason: {
      type: String,
    },
    soldBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: { type: String },
      email: { type: String },
    },
    emailStatus: {
      customer: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        error: { type: String, default: '' },
      },
      admin: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        error: { type: String, default: '' },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);
