const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

/**
 * Fast lookup customer by phone number (for counter auto-fill)
 */
async function lookupCustomer(req, res, next) {
  try {
    const { phone } = req.query;
    const cleaned = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!cleaned || cleaned.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit phone number.',
      });
    }

    const customer = await Customer.findOne({ phone: cleaned });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found.',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get customers with search and pagination
 */
async function getCustomers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = {};
    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { vehicleNumber: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get customer details and their full invoice history
 */
async function getCustomerDetails(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const sales = await Sale.find({
      $or: [
        { 'customerSnapshot.customerId': customer._id },
        { 'customerSnapshot.phone': customer.phone },
      ],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        customer,
        sales,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update customer details
 */
async function updateCustomer(req, res, next) {
  try {
    const { name, phone, email, address, vehicleNumber, vehicleModel } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email.trim();
    if (address !== undefined) customer.address = address.trim();
    if (vehicleNumber !== undefined) customer.vehicleNumber = vehicleNumber.trim();
    if (vehicleModel !== undefined) customer.vehicleModel = vehicleModel.trim();

    await customer.save();

    res.json({
      success: true,
      message: 'Customer profile updated successfully.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  lookupCustomer,
  getCustomers,
  getCustomerDetails,
  updateCustomer,
};
