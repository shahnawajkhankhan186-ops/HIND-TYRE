const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const ShopSettings = require('../models/ShopSettings');

/**
 * Server-side authoritative pricing engine.
 * Computes all financials from database documents using INTEGER PAISE only.
 * Zero trust in client calculations.
 */
class PricingService {
  /**
   * Calculate full invoice breakdown from database records
   */
  async computeSalePricing({ items, discountPaise = 0, session = null }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('At least one item is required in the sale.');
      error.statusCode = 400;
      throw error;
    }

    const settings = await ShopSettings.findOne().session(session) || { maxDiscountPercent: 15 };
    const maxDiscountPercent = settings.maxDiscountPercent || 15;

    let subtotalPaise = 0;
    let totalGstPaise = 0;
    const computedItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity || item.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        const error = new Error('Item quantity must be a positive integer.');
        error.statusCode = 400;
        throw error;
      }

      const itemId = item.tyreId || item.itemId || item._id;
      const itemType = item.itemType === 'Accessory' ? 'Accessory' : 'Tyre';

      let doc;
      let name = '';
      let companyName = '';
      let size = '';

      if (itemType === 'Accessory') {
        doc = await Accessory.findById(itemId).session(session);
        if (!doc) {
          const error = new Error(`Accessory with ID ${itemId} not found.`);
          error.statusCode = 404;
          throw error;
        }
        name = doc.name;
        companyName = doc.category || 'Accessory';
        size = '-';
      } else {
        doc = await Tyre.findById(itemId).populate('companyId').session(session);
        if (!doc) {
          const error = new Error(`Tyre with ID ${itemId} not found.`);
          error.statusCode = 404;
          throw error;
        }
        companyName = doc.companyId?.name || 'Tyre';
        name = `${companyName} ${doc.modelName}`;
        size = doc.size;
      }

      if (doc.isArchived || !doc.isActive) {
        const error = new Error(`Item ${name} is archived or inactive.`);
        error.statusCode = 400;
        throw error;
      }

      const unitPricePaise = Math.round(doc.sellingPricePaise);
      const gstPercent = Number(doc.gstPercent || 28);

      const itemSubtotalPaise = unitPricePaise * qty;
      const itemGstPaise = Math.round((itemSubtotalPaise * gstPercent) / 100);
      const lineTotalPaise = itemSubtotalPaise + itemGstPaise;

      subtotalPaise += itemSubtotalPaise;
      totalGstPaise += itemGstPaise;

      computedItems.push({
        itemType,
        itemId: doc._id,
        name,
        company: companyName,
        size,
        qty,
        unitPricePaise,
        gstPercent,
        gstPaise: itemGstPaise,
        lineTotalPaise,
      });
    }

    const requestedDiscountPaise = Math.max(0, parseInt(discountPaise || 0, 10));
    const maxDiscountAllowedPaise = Math.floor((subtotalPaise * maxDiscountPercent) / 100);

    if (requestedDiscountPaise > maxDiscountAllowedPaise) {
      const error = new Error(
        `Discount cannot exceed maximum policy of ${maxDiscountPercent}% (₹${(maxDiscountAllowedPaise / 100).toFixed(2)})`
      );
      error.statusCode = 400;
      throw error;
    }

    const totalPaise = Math.max(0, subtotalPaise + totalGstPaise - requestedDiscountPaise);

    return {
      items: computedItems,
      subtotalPaise,
      gstPaise: totalGstPaise,
      discountPaise: requestedDiscountPaise,
      totalPaise,
      maxDiscountAllowedPaise,
    };
  }
}

module.exports = new PricingService();
