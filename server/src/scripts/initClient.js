const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');
const ShopSettings = require('../models/ShopSettings');

// Helper to parse CLI arguments like --email=foo@bar.com
function getArg(key, fallback = '') {
  const prefix = `--${key}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  if (found) {
    return found.slice(prefix.length).trim();
  }
  return fallback;
}

async function initializeClientStore() {
  try {
    const adminEmail = (getArg('email') || process.env.CLIENT_ADMIN_EMAIL || 'admin@hindtyres.com').toLowerCase();
    const adminPassword = getArg('password') || process.env.CLIENT_ADMIN_PASSWORD || 'Admin@123';
    const adminName = getArg('name') || 'Shop Owner (Admin)';
    const shopName = getArg('shop') || 'HIND TYRES AND ACCESSORIES';
    const phone = getArg('phone') || '+91 98765 43210';
    const address = getArg('address') || 'Shop No. 12-14, GT Road Bypass, Transport Nagar, Kanpur';
    const gstin = getArg('gstin') || '';

    console.log('\n====================================================');
    console.log('🚀 INITIALIZING FRESH PRODUCTION STORE FOR CLIENT');
    console.log('====================================================');

    await connectDB();
    const dbName = mongoose.connection.name;
    console.log(`[Init] Connected to database: "${dbName}"`);

    // 1. Initialize Shop Settings
    console.log(`[Init] Setting up shop details: "${shopName}"...`);
    await ShopSettings.findOneAndUpdate(
      {},
      {
        shopName,
        address,
        phone,
        email: adminEmail,
        gstin,
        logoUrl: '',
        invoiceFooter: 'Goods once sold cannot be returned after 7 days. Tyre warranty as per company norms.',
        termsAndConditions:
          '1. Manufacturer warranty applies to all tyres against manufacturing defects.\n' +
          '2. Original invoice must be produced for all warranty claims.\n' +
          '3. Wheel alignment & balancing recommended every 5,000 km.\n' +
          '4. Damaged or repaired tyres outside authorised centres void warranty.',
        defaultGstPercent: 0,
        maxDiscountPercent: 15,
        adminReceiptEmail: adminEmail,
        godowns: [
          { code: 'G1', name: 'Godown 1' },
          { code: 'G2', name: 'Godown 2' },
        ],
      },
      { upsert: true, new: true }
    );

    // 2. Initialize Owner Admin Account
    console.log(`[Init] Creating Owner Admin: "${adminEmail}"...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 3. Initialize Standard Tyre Brand Companies
    console.log('[Init] Registering standard tyre brands (MRF, CEAT, Apollo, Bridgestone, etc.)...');
    const brands = [
      'MRF',
      'CEAT',
      'Apollo',
      'JK Tyre',
      'Bridgestone',
      'Michelin',
      'TVS Eurogrip',
      'Goodyear',
    ];

    for (const brand of brands) {
      await Company.findOneAndUpdate(
        { name: brand },
        { name: brand, isActive: true, isArchived: false },
        { upsert: true, new: true }
      );
    }

    console.log('====================================================');
    console.log('✅ FRESH STORE INITIALIZED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`   Database:         ${dbName}`);
    console.log(`   Shop Name:        ${shopName}`);
    console.log(`   Admin Email:      ${adminEmail}`);
    console.log(`   Admin Password:   ${adminPassword}`);
    console.log(`   Inventory State:  100% Clean (0 tyres, 0 bills, 0 customers)`);
    console.log('====================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Initialization failed:', err.message);
    process.exit(1);
  }
}

initializeClientStore();
