const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'HIND TYRES AND ACCESSORIES',
      required: true,
    },
    address: {
      type: String,
      default: 'Shop No. 12-14, GT Road Bypass, Transport Nagar, Kanpur, UP - 208001',
      required: true,
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
      required: true,
    },
    email: {
      type: String,
      default: 'contact@hindtyres.com',
    },
    gstin: {
      type: String,
      default: '09AAACH7409R1ZZ',
      required: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    invoiceFooter: {
      type: String,
      default: 'Goods once sold cannot be returned after 7 days. Tyre warranty as per company norms.',
    },
    termsAndConditions: {
      type: String,
      default: '1. All tyre warranties are subject to manufacturer inspection and approval.\n2. Original GST invoice must be produced for all warranty claims.\n3. Wheel balancing and alignment recommended every 5,000 km.',
    },
    defaultGstPercent: {
      type: Number,
      default: 28,
    },
    maxDiscountPercent: {
      type: Number,
      default: 15, // Cap discount at 15% unless configured otherwise
    },
    adminReceiptEmail: {
      type: String,
      default: 'admin@hindtyres.com',
    },
    brevoApiKey: {
      type: String,
      default: '',
    },
    brevoSenderEmail: {
      type: String,
      default: '',
    },
    brevoSenderName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
