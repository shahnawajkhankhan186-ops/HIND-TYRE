const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const saleController = require('../controllers/sale.controller');
const tyreController = require('../controllers/tyre.controller');
const companyController = require('../controllers/company.controller');
const accessoryController = require('../controllers/accessory.controller');
const stockController = require('../controllers/stock.controller');
const customerController = require('../controllers/customer.controller');
const dashboardController = require('../controllers/dashboard.controller');
const reportController = require('../controllers/report.controller');
const userController = require('../controllers/user.controller');
const settingsController = require('../controllers/settings.controller');
const auditController = require('../controllers/audit.controller');

const { authenticate, requireAdmin, requireCounterOrAdmin } = require('../middleware/auth.middleware');

// --- Health Check ---
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'HIND TYRES AND ACCESSORIES API', timestamp: new Date() });
});

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.googleLogin);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/reset-password', authController.resetPassword);

// --- Public / Customer Portal Routes ---
router.get('/portal/tyres', tyreController.getTyres);
router.get('/portal/companies', companyController.getCompanies);
router.get('/portal/settings', settingsController.getSettings);

// --- Counter / Sales Portal Routes (COUNTER + ADMIN) ---
router.get('/counter/catalog', authenticate, requireCounterOrAdmin, tyreController.getTyres);
router.get('/counter/accessories', authenticate, requireCounterOrAdmin, accessoryController.getAccessories);
router.get('/counter/companies', authenticate, requireCounterOrAdmin, companyController.getCompanies);
router.get('/counter/settings', authenticate, requireCounterOrAdmin, settingsController.getSettings);
router.get('/counter/customers/lookup', authenticate, requireCounterOrAdmin, customerController.lookupCustomer);
router.post('/counter/sales', authenticate, requireCounterOrAdmin, saleController.createSale);
router.get('/counter/sales', authenticate, requireCounterOrAdmin, saleController.getSales);
router.get('/counter/sales/:id/receipt.pdf', authenticate, requireCounterOrAdmin, saleController.getReceiptPdf);
router.post('/counter/sales/:id/resend-email', authenticate, requireCounterOrAdmin, saleController.resendReceiptEmail);

// --- Shared Sales Endpoints ---
router.get('/sales/:id/receipt.pdf', saleController.getReceiptPdf); // Allow public or authenticated viewing/downloading of receipt
router.get('/sales/:id', authenticate, requireCounterOrAdmin, saleController.getSaleById);
router.post('/sales/:id/resend-email', authenticate, requireCounterOrAdmin, saleController.resendReceiptEmail);
router.post('/sales/:id/cancel', authenticate, requireAdmin, saleController.cancelSale);

// --- Admin Portal Routes (ADMIN only) ---
// Dashboard
router.get('/admin/dashboard-stats', authenticate, requireAdmin, dashboardController.getDashboardStats);

// Companies
router.get('/admin/companies', authenticate, requireCounterOrAdmin, companyController.getCompanies);
router.post('/admin/companies', authenticate, requireAdmin, companyController.createCompany);
router.put('/admin/companies/:id', authenticate, requireAdmin, companyController.updateCompany);
router.delete('/admin/companies/:id', authenticate, requireAdmin, companyController.archiveCompany);

// Tyres Catalog
router.get('/admin/tyres', authenticate, requireAdmin, tyreController.getTyres);
router.get('/admin/tyres/:id', authenticate, requireAdmin, tyreController.getTyreById);
router.post('/admin/tyres', authenticate, requireAdmin, tyreController.createTyre);
router.put('/admin/tyres/:id', authenticate, requireAdmin, tyreController.updateTyre);
router.delete('/admin/tyres/:id', authenticate, requireAdmin, tyreController.archiveTyre);
router.post('/admin/tyres/bulk-price-update', authenticate, requireAdmin, tyreController.bulkPriceUpdate);

// Accessories
router.get('/admin/accessories', authenticate, requireAdmin, accessoryController.getAccessories);
router.post('/admin/accessories', authenticate, requireAdmin, accessoryController.createAccessory);
router.put('/admin/accessories/:id', authenticate, requireAdmin, accessoryController.updateAccessory);
router.delete('/admin/accessories/:id', authenticate, requireAdmin, accessoryController.archiveAccessory);

// Stock In & Adjustments & Transfers & Ledger
router.post('/admin/stock-in', authenticate, requireAdmin, stockController.stockIn);
router.post('/admin/stock-adjust', authenticate, requireAdmin, stockController.stockAdjust);
router.post('/admin/stock-transfer', authenticate, requireAdmin, stockController.transferStock);
router.get('/admin/stock-ledger', authenticate, requireAdmin, stockController.getStockLedger);

// Sales Ledger
router.get('/admin/sales', authenticate, requireAdmin, saleController.getSales);

// Customers
router.get('/admin/customers', authenticate, requireAdmin, customerController.getCustomers);
router.get('/admin/customers/:id', authenticate, requireAdmin, customerController.getCustomerDetails);
router.put('/admin/customers/:id', authenticate, requireAdmin, customerController.updateCustomer);

// Reports & Streaming CSV
router.get('/admin/reports/:type', authenticate, requireAdmin, reportController.getReport);
router.get('/admin/reports/:type/export', authenticate, requireAdmin, reportController.exportReportCSV);

// Counter Users Management
router.get('/admin/users', authenticate, requireAdmin, userController.getUsers);
router.post('/admin/users', authenticate, requireAdmin, userController.createUser);
router.patch('/admin/users/:id/toggle-status', authenticate, requireAdmin, userController.toggleUserStatus);

// Shop Settings
router.get('/admin/settings', authenticate, requireAdmin, settingsController.getSettings);
router.put('/admin/settings', authenticate, requireAdmin, settingsController.updateSettings);

// Audit Logs
router.get('/admin/audit-logs', authenticate, requireAdmin, auditController.getAuditLogs);

module.exports = router;
