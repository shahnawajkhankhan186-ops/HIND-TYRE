const { z } = require('zod');
const Company = require('../models/Company');
const Tyre = require('../models/Tyre');
const Sale = require('../models/Sale');
const auditService = require('../services/audit.service');

const companySchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  logoUrl: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
});

async function getCompanies(req, res, next) {
  try {
    const { includeArchived = 'false' } = req.query;
    const query = includeArchived === 'true' ? {} : { isArchived: false };

    const companies = await Company.find(query).sort({ name: 1 });
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
}

async function createCompany(req, res, next) {
  try {
    const data = companySchema.parse(req.body);

    const existing = await Company.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Company "${data.name}" already exists.`,
      });
    }

    const company = new Company(data);
    await company.save();

    await auditService.log({
      action: 'CREATE',
      entity: 'Company',
      entityId: company._id,
      afterSnapshot: company.toObject(),
      req,
      user: req.user,
    });

    res.status(201).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}

async function updateCompany(req, res, next) {
  try {
    const data = companySchema.partial().parse(req.body);
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const beforeSnapshot = company.toObject();
    Object.assign(company, data);
    await company.save();

    await auditService.log({
      action: 'UPDATE',
      entity: 'Company',
      entityId: company._id,
      beforeSnapshot,
      afterSnapshot: company.toObject(),
      req,
      user: req.user,
    });

    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete (Permanent) or Soft Delete (Archive) company
 */
async function archiveCompany(req, res, next) {
  try {
    const { permanent = 'false' } = req.query;
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Permanent hard delete if explicitly requested
    if (permanent === 'true') {
      await Company.findByIdAndDelete(company._id);

      await auditService.log({
        action: 'DELETE',
        entity: 'Company',
        entityId: company._id,
        beforeSnapshot: company.toObject(),
        req,
        user: req.user,
      });

      return res.json({
        success: true,
        message: `Company "${company.name}" has been permanently deleted from database.`,
        data: { _id: company._id, permanentlyDeleted: true },
      });
    }

    // Soft-delete (archive)
    const tyres = await Tyre.find({ companyId: company._id });
    const tyreIds = tyres.map((t) => t._id);
    const hasSales = await Sale.exists({ 'items.itemId': { $in: tyreIds } });

    company.isArchived = true;
    company.isActive = false;
    await company.save();

    // Also mark tyres under this company as inactive
    await Tyre.updateMany({ companyId: company._id }, { isActive: false });

    await auditService.log({
      action: 'ARCHIVE',
      entity: 'Company',
      entityId: company._id,
      afterSnapshot: { isArchived: true, hasSales: !!hasSales },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Company "${company.name}" has been archived successfully.`,
      data: company,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Restore an archived company back to active
 */
async function restoreCompany(req, res, next) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.isArchived = false;
    company.isActive = true;
    await company.save();

    // Also restore its tyres to active
    await Tyre.updateMany({ companyId: company._id }, { isActive: true });

    await auditService.log({
      action: 'RESTORE',
      entity: 'Company',
      entityId: company._id,
      afterSnapshot: company.toObject(),
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Company "${company.name}" has been restored to active status.`,
      data: company,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCompanies,
  createCompany,
  updateCompany,
  archiveCompany,
  restoreCompany,
};
