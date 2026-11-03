const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    serviceType: {
      type: String,
      enum: ['HOME_DELIVERY', 'WORKSHOP_VISIT'],
      default: 'HOME_DELIVERY',
      index: true,
    },
    deliveryAddress: {
      type: String,
      required: function () {
        return this.serviceType === 'HOME_DELIVERY';
      },
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: 'Ramgarh Cantt',
    },
    pincode: {
      type: String,
      trim: true,
      default: '829122',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    tyreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tyre',
      required: true,
    },
    tyreDetails: {
      brandName: { type: String, required: true },
      modelName: { type: String, required: true },
      size: { type: String, required: true },
      vehicleType: { type: String, required: true },
      tubeType: { type: String, default: 'Tubeless' },
      sellingPricePaise: { type: Number, required: true, min: 0 },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      default: 1,
    },
    vehicleModel: {
      type: String,
      trim: true,
      default: '',
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      enum: [
        'Morning (09:00 AM - 01:00 PM)',
        'Afternoon (01:00 PM - 05:00 PM)',
        'Evening (05:00 PM - 08:00 PM)',
      ],
      default: 'Morning (09:00 AM - 01:00 PM)',
    },
    tyreTotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDeliveryChargePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFreeFitting: {
      type: Boolean,
      default: true,
    },
    totalAmountPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    assignedStaff: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledReason: {
      type: String,
      trim: true,
      default: '',
    },
    confirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

