const { z } = require('zod');
const Accessory = require('../models/Accessory');
const Sale = require('../models/Sale');
const auditService = require('../services/audit.service');

const accessorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.enum(['Tube', 'Valve', 'Alloy wheel', 'Wheel cover', 'Balancing weight', 'Puncture kit', 'Other']),
  sku: z.string().min(2, 'SKU is required'),
  purchasePricePaise: z.number().int().min(0).default(0),
  sellingPricePaise: z.number().int().min(0, 'Selling price must be positive'),
  mrpPaise: z.number().int().min(0).default(0),
  gstPercent: z.number().min(0).max(100).default(0),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().optional().default(true),
});

async function getAccessories(req, res, next) {
  try {
    const {
      page = 1,
      limit = 25,
      category,
      search = '',
      lowStock = 'false',
      includeArchived = 'false',
    } = req.query;

    const query = {};
    if (includeArchived !== 'true') query.isArchived = false;
    if (category) query.category = category;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }
    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { sku: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [accessories, totalCount] = await Promise.all([
      Accessory.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Accessory.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        accessories,
        total: totalCount,
        page: parseInt(page, 10),
        pages: Math.ceil(totalCount / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createAccessory(req, res, next) {
  try {
    const data = accessorySchema.parse(req.body);

    const existingSku = await Accessory.findOne({ sku: data.sku.toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        error: `Accessory with SKU "${data.sku}" already exists.`,
      });
    }

    const accessory = new Accessory({
      ...data,
      sku: data.sku.toUpperCase(),
    });
    await accessory.save();

    await auditService.log({
      action: 'CREATE',
      entity: 'Accessory',
      entityId: accessory._id,
      afterSnapshot: accessory.toObject(),
      req,
      user: req.user,
    });

    res.status(201).json({ success: true, data: accessory });
  } catch (err) {
    next(err);
  }
}

async function updateAccessory(req, res, next) {
  try {
    const data = accessorySchema.partial().parse(req.body);
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ success: false, error: 'Accessory not found' });
    }

    const beforeSnapshot = accessory.toObject();
    Object.assign(accessory, data);
    if (data.sku) {
      accessory.sku = data.sku.toUpperCase();
    }
    await accessory.save();

    await auditService.log({
      action: 'UPDATE',
      entity: 'Accessory',
      entityId: accessory._id,
      beforeSnapshot,
      afterSnapshot: accessory.toObject(),
      req,
      user: req.user,
    });

    res.json({ success: true, data: accessory });
  } catch (err) {
    next(err);
  }
}

async function archiveAccessory(req, res, next) {
  try {
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ success: false, error: 'Accessory not found' });
    }

    const hasSales = await Sale.exists({ 'items.itemId': accessory._id });

    accessory.isArchived = true;
    accessory.isActive = false;
    await accessory.save();

    await auditService.log({
      action: 'ARCHIVE',
      entity: 'Accessory',
      entityId: accessory._id,
      afterSnapshot: { isArchived: true, hasSales: !!hasSales },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Accessory "${accessory.name}" archived successfully.`,
      data: accessory,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAccessories,
  createAccessory,
  updateAccessory,
  archiveAccessory,
};
