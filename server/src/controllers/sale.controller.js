const mongoose = require('mongoose');
const { z } = require('zod');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const ShopSettings = require('../models/ShopSettings');
const pricingService = require('../services/pricing.service');
const stockService = require('../services/stock.service');
const invoiceService = require('../services/invoice.service');
const auditService = require('../services/audit.service');
const { generateInvoicePDF } = require('../utils/pdfInvoice');
const { sendInvoiceEmail } = require('../utils/mailer');
const { getISTDateRange } = require('../utils/ist-date');

const createSaleSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'Customer name is required'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number is required'),
    email: z.string().email('Valid email is required'),
    address: z.string().min(3, 'Address is required'),
    vehicleNumber: z.string().optional().default(''),
    vehicleModel: z.string().optional().default(''),
  }),
  items: z.array(
    z.object({
      itemId: z.string().optional(),
      tyreId: z.string().optional(),
      itemType: z.enum(['Tyre', 'Accessory']).default('Tyre'),
      quantity: z.number().int().positive('Quantity must be greater than zero'),
    })
  ).min(1, 'Sale must include at least one item'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']).default('CASH'),
  discountPaise: z.number().int().min(0).optional().default(0),
});

/**
 * Create a new Sale inside a strict MongoDB ACID transaction
 */
async function createSale(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validatedData = createSaleSchema.parse(req.body);
    const { customer, items, paymentMode, discountPaise } = validatedData;

    // 1. Authoritative Server-Side Pricing Calculation (Zero client trust)
    const pricingResult = await pricingService.computeSalePricing({
      items,
      discountPaise,
      session,
    });

    // 2. Generate Next Sequential Invoice Number
    const invoiceNo = await invoiceService.getNextInvoiceNumber(session);

    // 3. Upsert Customer by Phone
    let customerDoc = await Customer.findOne({ phone: customer.phone }).session(session);
    if (!customerDoc) {
      customerDoc = new Customer({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        vehicleNumber: customer.vehicleNumber,
        vehicleModel: customer.vehicleModel,
        totalPurchasesPaise: pricingResult.totalPaise,
        totalInvoicesCount: 1,
      });
      await customerDoc.save({ session });
    } else {
      customerDoc.name = customer.name;
      customerDoc.email = customer.email;
      customerDoc.address = customer.address;
      if (customer.vehicleNumber) customerDoc.vehicleNumber = customer.vehicleNumber;
      if (customer.vehicleModel) customerDoc.vehicleModel = customer.vehicleModel;
      customerDoc.totalPurchasesPaise += pricingResult.totalPaise;
      customerDoc.totalInvoicesCount += 1;
      await customerDoc.save({ session });
    }

    // 4. Atomic Stock Deduction & StockMovement Creation
    // (If stock < requested qty, aborts with 409 Conflict)
    await stockService.recordSaleDeductions({
      items: pricingResult.items,
      session,
      reference: invoiceNo,
      user: req.user,
    });

    // 5. Create Sale Record
    const sale = new Sale({
      invoiceNo,
      customerSnapshot: {
        customerId: customerDoc._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        vehicleNumber: customer.vehicleNumber,
        vehicleModel: customer.vehicleModel,
      },
      items: pricingResult.items,
      subtotalPaise: pricingResult.subtotalPaise,
      gstPaise: pricingResult.gstPaise,
      discountPaise: pricingResult.discountPaise,
      totalPaise: pricingResult.totalPaise,
      paymentMode,
      paymentStatus: paymentMode === 'CREDIT' ? 'PENDING' : 'PAID',
      status: 'COMPLETED',
      soldBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });

    await sale.save({ session });

    // 6. Log Audit
    await auditService.log({
      action: 'SALE',
      entity: 'Sale',
      entityId: sale._id,
      afterSnapshot: {
        invoiceNo: sale.invoiceNo,
        totalPaise: sale.totalPaise,
        itemsCount: sale.items.length,
      },
      req,
      user: req.user,
      session,
    });

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // 7. Non-blocking Background PDF Generation & Email Dispatch
    // Failures here MUST NOT rollback the committed sale!
    setImmediate(async () => {
      try {
        const settings = await ShopSettings.findOne();
        const pdfBuffer = await generateInvoicePDF({ sale, settings });

        // Email Customer
        const customerEmailResult = await sendInvoiceEmail({
          recipientEmail: sale.customerSnapshot.email,
          sale,
          pdfBuffer,
          recipientType: 'customer',
          shopSettings: settings,
        });

        // Email Admin
        const adminEmail = settings?.adminReceiptEmail || process.env.ADMIN_RECEIPT_EMAIL;
        let adminEmailResult = { success: false };
        if (adminEmail) {
          adminEmailResult = await sendInvoiceEmail({
            recipientEmail: adminEmail,
            sale,
            pdfBuffer,
            recipientType: 'admin',
            shopSettings: settings,
          });
        }

        // Update emailStatus
        await Sale.findByIdAndUpdate(sale._id, {
          emailStatus: {
            customer: {
              sent: customerEmailResult.success,
              sentAt: customerEmailResult.success ? new Date() : null,
              error: customerEmailResult.error || '',
            },
            admin: {
              sent: adminEmailResult.success,
              sentAt: adminEmailResult.success ? new Date() : null,
              error: adminEmailResult.error || '',
            },
          },
        });
      } catch (emailErr) {
        console.error('Async receipt email processing error:', emailErr.message);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      data: sale,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (_) {}
    session.endSession();

    // Map MongoDB concurrency WriteConflict (code 112) to 409 Conflict
    if (
      err.code === 112 ||
      err.message?.includes('WriteConflict') ||
      (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError'))
    ) {
      err.statusCode = 409;
      err.message = 'Insufficient stock: item was updated by a concurrent sale.';
    }

    next(err);
  }
}

/**
 * Get all sales with flexible date, status, payment filters, search & pagination
 */
async function getSales(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      date = 'all',
      startDate,
      endDate,
      paymentMode,
      status,
      onlyMine = 'false',
    } = req.query;

    const query = {};

    // Filter by counter staff's own sales if requested
    if (onlyMine === 'true' && req.user.role === 'COUNTER') {
      query['soldBy.userId'] = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (paymentMode) {
      query.paymentMode = paymentMode;
    }

    // Date filtering
    if (date !== 'all') {
      const range = getISTDateRange(date);
      if (range) {
        query.createdAt = { $gte: range.start, $lte: range.end };
      }
    } else if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // Search query: invoice number, customer name or phone
    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { invoiceNo: { $regex: s, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: s, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: s, $options: 'i' } },
        { 'customerSnapshot.vehicleNumber': { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [sales, totalCount] = await Promise.all([
      Sale.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Sale.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        sales,
        total: totalCount,
        page: parseInt(page, 10),
        pages: Math.ceil(totalCount / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Sale by ID
 */
async function getSaleById(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale invoice not found.',
      });
    }
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

/**
 * Stream receipt PDF directly to client in-memory
 */
async function getReceiptPdf(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    const settings = await ShopSettings.findOne();
    const pdfBuffer = await generateInvoicePDF({ sale, settings });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${sale.invoiceNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Manually resend receipt email with PDF attachment
 */
async function resendReceiptEmail(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found.' });
    }

    const settings = await ShopSettings.findOne();
    const pdfBuffer = await generateInvoicePDF({ sale, settings });

    const customerEmailResult = await sendInvoiceEmail({
      recipientEmail: sale.customerSnapshot.email,
      sale,
      pdfBuffer,
      recipientType: 'customer',
      shopSettings: settings,
    });

    const adminEmail = settings?.adminReceiptEmail || process.env.ADMIN_RECEIPT_EMAIL;
    let adminEmailResult = { success: false };
    if (adminEmail) {
      adminEmailResult = await sendInvoiceEmail({
        recipientEmail: adminEmail,
        sale,
        pdfBuffer,
        recipientType: 'admin',
        shopSettings: settings,
      });
    }

    sale.emailStatus = {
      customer: {
        sent: customerEmailResult.success,
        sentAt: customerEmailResult.success ? new Date() : sale.emailStatus?.customer?.sentAt,
        error: customerEmailResult.error || '',
      },
      admin: {
        sent: adminEmailResult.success,
        sentAt: adminEmailResult.success ? new Date() : sale.emailStatus?.admin?.sentAt,
        error: adminEmailResult.error || '',
      },
    };
    await sale.save();

    res.json({
      success: true,
      message: customerEmailResult.success
        ? 'Receipt email dispatched successfully!'
        : 'Failed to dispatch email. Check SMTP settings.',
      data: sale.emailStatus,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel Sale inside MongoDB Transaction and restore inventory
 */
async function cancelSale(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      const error = new Error('A cancellation reason is required.');
      error.statusCode = 400;
      throw error;
    }

    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) {
      const error = new Error('Sale not found.');
      error.statusCode = 404;
      throw error;
    }

    if (sale.status === 'CANCELLED') {
      const error = new Error('This sale is already cancelled.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Transactionally restore stock for all items in the invoice
    await stockService.recordSaleCancelRestore({
      sale,
      session,
      user: req.user,
      reason,
    });

    // 2. Mark sale as CANCELLED
    const beforeSnapshot = { status: sale.status };
    sale.status = 'CANCELLED';
    sale.cancelledAt = new Date();
    sale.cancelledBy = req.user._id;
    sale.cancelReason = reason.trim();
    await sale.save({ session });

    // 3. Update customer stats
    if (sale.customerSnapshot?.customerId) {
      await Customer.findByIdAndUpdate(
        sale.customerSnapshot.customerId,
        {
          $inc: {
            totalPurchasesPaise: -sale.totalPaise,
            totalInvoicesCount: -1,
          },
        },
        { session }
      );
    }

    // 4. Record Audit Log
    await auditService.log({
      action: 'SALE_CANCEL',
      entity: 'Sale',
      entityId: sale._id,
      beforeSnapshot,
      afterSnapshot: { status: 'CANCELLED', reason },
      req,
      user: req.user,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Sale cancelled and stock restored to inventory successfully.',
      data: sale,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

module.exports = {
  createSale,
  getSales,
  getSaleById,
  getReceiptPdf,
  resendReceiptEmail,
  cancelSale,
};
