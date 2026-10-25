const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    vehicleModel: {
      type: String,
      default: '',
      trim: true,
    },
    totalPurchasesPaise: {
      type: Number,
      default: 0,
    },
    totalInvoicesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Customer', customerSchema);
