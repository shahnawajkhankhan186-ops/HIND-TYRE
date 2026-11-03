const { z } = require('zod');
const Appointment = require('../models/Appointment');
const Tyre = require('../models/Tyre');
const Company = require('../models/Company');
const auditService = require('../services/audit.service');

const createAppointmentSchema = z.object({
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit mobile number'),
  customerEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  serviceType: z.enum(['HOME_DELIVERY', 'WORKSHOP_VISIT']).default('HOME_DELIVERY'),
  deliveryAddress: z.string().trim().optional().default(''),
  landmark: z.string().trim().optional().default(''),
  city: z.string().trim().optional().default('Ramgarh Cantt'),
  pincode: z.string().trim().optional().default('829122'),
  companyId: z.string().min(1, 'Company selection is required'),
  tyreId: z.string().min(1, 'Tyre selection is required'),
  quantity: z.number().int().min(1).max(20).default(1),
  vehicleModel: z.string().trim().optional().default(''),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  timeSlot: z
    .enum([
      'Morning (09:00 AM - 01:00 PM)',
      'Afternoon (01:00 PM - 05:00 PM)',
      'Evening (05:00 PM - 08:00 PM)',
    ])
    .default('Morning (09:00 AM - 01:00 PM)'),
});

/**
 * Generate human-friendly booking number: APT-YYMMDD-XXXX
 */
function generateBookingNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APT-${y}${m}${d}-${rand}`;
}

/**
 * Public: Create New Appointment Booking
 */
async function createAppointment(req, res, next) {
  try {
    const validated = createAppointmentSchema.parse(req.body);

    if (validated.serviceType === 'HOME_DELIVERY' && !validated.deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Complete delivery address is required for Home Delivery & Fitting.',
      });
    }

    // Verify tyre existence and real-time available stock
    const tyre = await Tyre.findOne({
      _id: validated.tyreId,
      isArchived: false,
      isActive: true,
    }).populate('companyId', 'name logoUrl');

    if (!tyre) {
      return res.status(404).json({
        success: false,
        error: 'Selected tyre model is currently not available.',
      });
    }

    // STRICT CHECK: Tyre must be strictly in stock (quantity > 0 and >= requested)
    if (tyre.quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: `Sorry, ${tyre.modelName} (${tyre.size}) is currently out of stock.`,
      });
    }

    if (tyre.quantity < validated.quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${tyre.quantity} units available in stock. Please select a lower quantity.`,
      });
    }

    const tyreTotalPaise = tyre.sellingPricePaise * validated.quantity;
    const estimatedDeliveryChargePaise = 0; // Distance-based delivery charge note
    const totalAmountPaise = tyreTotalPaise + estimatedDeliveryChargePaise;

    const bookingNumber = generateBookingNumber();

    const appointment = new Appointment({
      bookingNumber,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      customerEmail: validated.customerEmail || '',
      serviceType: validated.serviceType,
      deliveryAddress: validated.deliveryAddress,
      landmark: validated.landmark,
      city: validated.city || 'Ramgarh Cantt',
      pincode: validated.pincode || '829122',
      companyId: tyre.companyId._id,
      tyreId: tyre._id,
      tyreDetails: {
        brandName: tyre.companyId?.name || 'Hind Tyres',
        modelName: tyre.modelName,
        size: tyre.size,
        vehicleType: tyre.vehicleType,
        tubeType: tyre.tubeType || 'Tubeless',
        sellingPricePaise: tyre.sellingPricePaise,
      },
      quantity: validated.quantity,
      vehicleModel: validated.vehicleModel,
      appointmentDate: new Date(validated.appointmentDate),
      timeSlot: validated.timeSlot,
      tyreTotalPaise,
      estimatedDeliveryChargePaise,
      isFreeFitting: true,
      totalAmountPaise,
      status: 'PENDING',
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: `Appointment ${bookingNumber} booked successfully! Our technician will call you to confirm.`,
      data: appointment,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: err.errors[0]?.message || 'Validation error',
      });
    }
    next(err);
  }
}

/**
 * Public: Get Available Tyres for Appointment Booking
 * (STRICT: ONLY tyres with quantity > 0 and active, no out-of-stock items)
 */
async function getAvailableTyresForBooking(req, res, next) {
  try {
    const { companyId, vehicleType } = req.query;

    const query = {
      isArchived: false,
      isActive: true,
      quantity: { $gt: 0 }, // Strict stock requirement: must have at least 1 in stock
    };

    if (companyId) {
      query.companyId = companyId;
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    const tyres = await Tyre.find(query)
      .populate('companyId', 'name logoUrl')
      .select('modelName size vehicleType tubeType sellingPricePaise quantity companyId')
      .sort({ 'companyId.name': 1, modelName: 1 });

    // Distinct companies that actually have stock right now
    const companyIdsWithStock = [...new Set(tyres.map((t) => t.companyId?._id?.toString()).filter(Boolean))];
    const availableCompanies = await Company.find({
      _id: { $in: companyIdsWithStock },
      isArchived: false,
      isActive: true,
    })
      .select('name logoUrl')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        tyres,
        companies: availableCompanies,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get All Appointments with Filters and Stats
 */
async function getAdminAppointments(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      search = '',
      serviceType,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { bookingNumber: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { customerPhone: { $regex: s, $options: 'i' } },
        { deliveryAddress: { $regex: s, $options: 'i' } },
        { 'tyreDetails.modelName': { $regex: s, $options: 'i' } },
        { 'tyreDetails.size': { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [appointments, total, statsAggregation] = await Promise.all([
      Appointment.find(query)
        .populate('companyId', 'name logoUrl')
        .populate('tyreId', 'modelName size quantity')
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Appointment.countDocuments(query),
      Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build stats breakdown
    const stats = {
      all: 0,
      PENDING: 0,
      CONFIRMED: 0,
      OUT_FOR_DELIVERY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    statsAggregation.forEach((item) => {
      if (stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
      stats.all += item.count;
    });

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10)) || 1,
        },
        stats,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get Single Appointment
 */
async function getAdminAppointmentById(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('companyId', 'name logoUrl')
      .populate('tyreId', 'modelName size quantity sellingPricePaise');

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update Appointment Status & Details
 */
async function updateAdminAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const {
      status,
      estimatedDeliveryChargePaise,
      adminNotes,
      assignedStaff,
      cancelledReason,
    } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (status) {
      appointment.status = status;
      if (status === 'CONFIRMED' && !appointment.confirmedAt) {
        appointment.confirmedAt = new Date();
      }
      if (status === 'COMPLETED' && !appointment.completedAt) {
        appointment.completedAt = new Date();
      }
    }

    if (typeof estimatedDeliveryChargePaise === 'number' && estimatedDeliveryChargePaise >= 0) {
      appointment.estimatedDeliveryChargePaise = Math.round(estimatedDeliveryChargePaise);
      appointment.totalAmountPaise =
        appointment.tyreTotalPaise + appointment.estimatedDeliveryChargePaise;
    }

    if (adminNotes !== undefined) appointment.adminNotes = adminNotes;
    if (assignedStaff !== undefined) appointment.assignedStaff = assignedStaff;
    if (cancelledReason !== undefined) appointment.cancelledReason = cancelledReason;

    await appointment.save();

    if (req.user) {
      await auditService.log({
        userId: req.user._id,
        action: 'UPDATE_APPOINTMENT_STATUS',
        entity: 'Appointment',
        entityId: appointment._id,
        details: {
          bookingNumber: appointment.bookingNumber,
          newStatus: appointment.status,
          deliveryChargePaise: appointment.estimatedDeliveryChargePaise,
        },
      });
    }

    res.json({
      success: true,
      message: `Appointment ${appointment.bookingNumber} updated to ${appointment.status}`,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete Appointment
 */
async function deleteAdminAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (req.user) {
      await auditService.log({
        userId: req.user._id,
        action: 'DELETE_APPOINTMENT',
        entity: 'Appointment',
        entityId: id,
        details: { bookingNumber: appointment.bookingNumber },
      });
    }

    res.json({
      success: true,
      message: `Appointment ${appointment.bookingNumber} deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAppointment,
  getAvailableTyresForBooking,
  getAdminAppointments,
  getAdminAppointmentById,
  updateAdminAppointmentStatus,
  deleteAdminAppointment,
};

