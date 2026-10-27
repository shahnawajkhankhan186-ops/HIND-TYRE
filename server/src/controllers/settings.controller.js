const { z } = require('zod');
const ShopSettings = require('../models/ShopSettings');
const auditService = require('../services/audit.service');

const settingsSchema = z.object({
  shopName: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(8),
  email: z.string().email(),
  gstin: z.string().min(10),
  logoUrl: z.string().optional().default(''),
  invoiceFooter: z.string().optional().default(''),
  termsAndConditions: z.string().optional().default(''),
  defaultGstPercent: z.number().min(0).max(100).default(28),
  maxDiscountPercent: z.number().min(0).max(100).default(15),
  adminReceiptEmail: z.string().email(),
  brevoApiKey: z.string().optional().default(''),
  brevoSenderEmail: z.string().email().optional().or(z.literal('')).default(''),
  brevoSenderName: z.string().optional().default(''),
});

async function getSettings(req, res, next) {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = new ShopSettings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const data = settingsSchema.parse(req.body);

    let settings = await ShopSettings.findOne();
    const beforeSnapshot = settings ? settings.toObject() : null;

    if (!settings) {
      settings = new ShopSettings(data);
    } else {
      Object.assign(settings, data);
    }
    await settings.save();

    await auditService.log({
      action: 'UPDATE_SETTINGS',
      entity: 'ShopSettings',
      entityId: settings._id,
      beforeSnapshot,
      afterSnapshot: settings.toObject(),
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: 'Shop settings updated successfully.',
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

async function testEmailDelivery(req, res, next) {
  try {
    const targetEmail = req.body.email || req.user.email;
    const settings = await ShopSettings.findOne();

    const sampleSale = {
      invoiceNo: 'HT-TEST-0001',
      createdAt: new Date(),
      paymentMode: 'UPI',
      paymentStatus: 'PAID',
      customerSnapshot: {
        name: 'Test Customer',
        phone: '9876543210',
        email: targetEmail,
        vehicleNumber: 'UP78-AB-1234',
        vehicleModel: 'Hyundai Creta',
      },
      soldBy: {
        name: req.user.name,
        email: req.user.email,
      },
      items: [
        {
          name: 'MRF ZLX 195/65 R15 (Sample)',
          size: '195/65 R15',
          brand: 'MRF',
          itemType: 'Tyre',
          qty: 2,
          unitPricePaise: 450000,
          lineTotalPaise: 900000,
        },
      ],
      subtotalPaise: 703125,
      gstPaise: 196875,
      discountPaise: 0,
      totalPaise: 900000,
    };

    const { generateInvoicePDF } = require('../utils/pdfInvoice');
    const { sendInvoiceEmail } = require('../utils/mailer');
    const pdfBuffer = await generateInvoicePDF({ sale: sampleSale, settings });

    const result = await sendInvoiceEmail({
      recipientEmail: targetEmail,
      recipientName: req.user.name,
      sale: sampleSale,
      pdfBuffer,
      recipientType: 'seller',
      sellerInfo: { name: req.user.name, email: req.user.email },
      shopSettings: settings,
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Test email dispatched successfully to ${targetEmail} via ${result.provider || (result.mock ? 'mock preview' : 'configured mailer')}!`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to dispatch test email',
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  testEmailDelivery,
};
