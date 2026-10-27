const { z } = require('zod');
const Tyre = require('../models/Tyre');
const Sale = require('../models/Sale');
const Company = require('../models/Company');
const auditService = require('../services/audit.service');

const tyreSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  modelName: z.string().min(1, 'Model name is required'),
  size: z.string().min(1, 'Tyre size is required'),
  vehicleType: z.enum(['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto']),
  tubeType: z.enum(['Tubeless', 'Tube-type']).default('Tubeless'),
  plyRating: z.string().optional().default(''),
  loadIndex: z.string().optional().default(''),
  speedRating: z.string().optional().default(''),
  sku: z.string().min(2, 'SKU is required'),
  purchasePricePaise: z.number().int().min(0, 'Purchase price must be positive'),
  sellingPricePaise: z.number().int().min(0, 'Selling price must be positive'),
  mrpPaise: z.number().int().min(0, 'MRP must be positive'),
  gstPercent: z.number().min(0).max(100).default(0),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  isActive: z.boolean().optional().default(true),
});

/**
 * Get Tyres with rich filtering, search, and pagination
 */
async function getTyres(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      companyId,
      vehicleType,
      size,
      lowStock = 'false',
      outOfStock = 'false',
      includeArchived = 'false',
      sort = 'modelName',
      order = 'asc',
    } = req.query;

    const query = {};

    if (includeArchived !== 'true') {
      query.isArchived = false;
    }

    if (companyId) {
      query.companyId = companyId;
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    if (size) {
      query.size = { $regex: size, $options: 'i' };
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    if (outOfStock === 'true') {
      query.quantity = { $lte: 0 };
    }

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { modelName: { $regex: s, $options: 'i' } },
        { size: { $regex: s, $options: 'i' } },
        { sku: { $regex: s, $options: 'i' } },
      ];
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [tyres, totalCount] = await Promise.all([
      Tyre.find(query)
        .populate('companyId', 'name logoUrl')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Tyre.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tyres,
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
 * Get single tyre by ID
 */
async function getTyreById(req, res, next) {
  try {
    const tyre = await Tyre.findById(req.params.id).populate('companyId');
    if (!tyre) {
      return res.status(404).json({ success: false, error: 'Tyre not found.' });
    }
    res.json({ success: true, data: tyre });
  } catch (err) {
    next(err);
  }
}

/**
 * Create new Tyre
 */
async function createTyre(req, res, next) {
  try {
    const data = tyreSchema.parse(req.body);

    const existingSku = await Tyre.findOne({ sku: data.sku.toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        error: `Tyre with SKU "${data.sku}" already exists.`,
      });
    }

    const tyre = new Tyre({
      ...data,
      sku: data.sku.toUpperCase(),
    });
    await tyre.save();

    await auditService.log({
      action: 'CREATE',
      entity: 'Tyre',
      entityId: tyre._id,
      afterSnapshot: tyre.toObject(),
      req,
      user: req.user,
    });

    res.status(201).json({ success: true, data: tyre });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Tyre details/pricing
 */
async function updateTyre(req, res, next) {
  try {
    const data = tyreSchema.partial().parse(req.body);
    const tyre = await Tyre.findById(req.params.id);
    if (!tyre) {
      return res.status(404).json({ success: false, error: 'Tyre not found.' });
    }

    const beforeSnapshot = tyre.toObject();
    Object.assign(tyre, data);
    if (data.sku) {
      tyre.sku = data.sku.toUpperCase();
    }
    await tyre.save();

    await auditService.log({
      action: 'UPDATE',
      entity: 'Tyre',
      entityId: tyre._id,
      beforeSnapshot,
      afterSnapshot: tyre.toObject(),
      req,
      user: req.user,
    });

    res.json({ success: true, data: tyre });
  } catch (err) {
    next(err);
  }
}

/**
 * Soft delete (archive) Tyre
 */
async function archiveTyre(req, res, next) {
  try {
    const tyre = await Tyre.findById(req.params.id);
    if (!tyre) {
      return res.status(404).json({ success: false, error: 'Tyre not found.' });
    }

    // Check if referenced by any invoices
    const hasSales = await Sale.exists({ 'items.itemId': tyre._id });

    // Per Rule 7: Soft-delete (archive) records that have history, never hard delete records referenced by invoices
    tyre.isArchived = true;
    tyre.isActive = false;
    await tyre.save();

    await auditService.log({
      action: 'ARCHIVE',
      entity: 'Tyre',
      entityId: tyre._id,
      afterSnapshot: { isArchived: true, hasSales: !!hasSales },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Tyre "${tyre.modelName} ${tyre.size}" has been archived successfully.`,
      data: tyre,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk Price Update with Preview & Apply
 * e.g. "+5% for all MRF tyres" or flat change
 */
async function bulkPriceUpdate(req, res, next) {
  try {
    const {
      companyId,
      vehicleType,
      percentageDelta, // e.g. 5 for +5%, -3 for -3%
      flatPaiseDelta, // e.g. 5000 paise (₹50)
      preview = true,
    } = req.body;

    const query = { isArchived: false, isActive: true };
    if (companyId) query.companyId = companyId;
    if (vehicleType) query.vehicleType = vehicleType;

    const tyres = await Tyre.find(query).populate('companyId', 'name');

    if (tyres.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No matching active tyres found for this criteria.',
      });
    }

    const previewList = tyres.map(tyre => {
      let newSellingPricePaise = tyre.sellingPricePaise;

      if (percentageDelta !== undefined && percentageDelta !== null) {
        const factor = 1 + Number(percentageDelta) / 100;
        newSellingPricePaise = Math.round(tyre.sellingPricePaise * factor);
      } else if (flatPaiseDelta !== undefined && flatPaiseDelta !== null) {
        newSellingPricePaise = Math.max(0, tyre.sellingPricePaise + Number(flatPaiseDelta));
      }

      return {
        _id: tyre._id,
        sku: tyre.sku,
        modelName: tyre.modelName,
        size: tyre.size,
        companyName: tyre.companyId?.name || '',
        currentSellingPricePaise: tyre.sellingPricePaise,
        newSellingPricePaise,
        differencePaise: newSellingPricePaise - tyre.sellingPricePaise,
      };
    });

    // If only preview is requested, return preview data without updating
    if (preview) {
      return res.json({
        success: true,
        preview: true,
        count: previewList.length,
        items: previewList,
      });
    }

    // Apply the updates
    const bulkOps = previewList.map(item => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { sellingPricePaise: item.newSellingPricePaise } },
      },
    }));

    await Tyre.bulkWrite(bulkOps);

    await auditService.log({
      action: 'BULK_PRICE_UPDATE',
      entity: 'Tyre',
      afterSnapshot: {
        companyId,
        vehicleType,
        percentageDelta,
        flatPaiseDelta,
        updatedCount: previewList.length,
      },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Bulk price update applied successfully to ${previewList.length} tyres.`,
      count: previewList.length,
      items: previewList,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTyres,
  getTyreById,
  createTyre,
  updateTyre,
  archiveTyre,
  bulkPriceUpdate,
};
