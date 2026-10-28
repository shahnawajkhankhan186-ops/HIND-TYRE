const { z } = require('zod');
const ShopSettings = require('../models/ShopSettings');
const auditService = require('../services/audit.service');

const settingsSchema = z.object({
  shopName: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(8),
  email: z.string().email(),
  gstin: z.string().optional().default(''),
  logoUrl: z.string().optional().default(''),
  invoiceFooter: z.string().optional().default(''),
  termsAndConditions: z.string().optional().default(''),
  defaultGstPercent: z.number().optional().default(0),
  maxDiscountPercent: z.number().min(0).max(100).default(15),
  adminReceiptEmail: z.string().email().optional().default('admin@hindtyres.com'),
  godowns: z.array(
    z.object({
      code: z.enum(['G1', 'G2']),
      name: z.string().min(1, 'Godown name is required'),
    })
  ).optional(),
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

module.exports = {
  getSettings,
  updateSettings,
};
