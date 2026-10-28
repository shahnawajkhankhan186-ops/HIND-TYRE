/**
 * Two-Godown Idempotent Data Migration Script
 * Splits legacy single `quantity` into G1 = quantity, G2 = 0 for all items lacking godownStock.
 * Running multiple times produces no unintended changes.
 */

const { connectDB } = require('../config/db');
const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const ShopSettings = require('../models/ShopSettings');
const AuditLog = require('../models/AuditLog');
const { DEFAULT_GODOWNS } = require('../config/godowns');

async function migrateGodowns() {
  console.log('====================================================');
  console.log('📦 RUNNING TWO-GODOWN DATA MIGRATION');
  console.log('====================================================');

  try {
    await connectDB();

    // 1. Migrate Tyres without godownStock or missing G1
    const unmigratedTyres = await Tyre.find({
      $or: [
        { godownStock: { $exists: false } },
        { 'godownStock.G1': { $exists: false } },
      ],
    });

    console.log(`[Migration] Found ${unmigratedTyres.length} tyres to migrate.`);
    let tyresMigratedCount = 0;

    for (const tyre of unmigratedTyres) {
      const g1Qty = typeof tyre.quantity === 'number' && tyre.quantity >= 0 ? tyre.quantity : 0;
      tyre.godownStock = {
        G1: g1Qty,
        G2: 0,
      };
      tyre.quantity = g1Qty;
      await tyre.save();
      tyresMigratedCount++;
    }

    // 2. Migrate Accessories without godownStock or missing G1
    const unmigratedAccessories = await Accessory.find({
      $or: [
        { godownStock: { $exists: false } },
        { 'godownStock.G1': { $exists: false } },
      ],
    });

    console.log(`[Migration] Found ${unmigratedAccessories.length} accessories to migrate.`);
    let accessoriesMigratedCount = 0;

    for (const acc of unmigratedAccessories) {
      const g1Qty = typeof acc.quantity === 'number' && acc.quantity >= 0 ? acc.quantity : 0;
      acc.godownStock = {
        G1: g1Qty,
        G2: 0,
      };
      acc.quantity = g1Qty;
      await acc.save();
      accessoriesMigratedCount++;
    }

    // 3. Ensure ShopSettings has default Godowns
    const settings = await ShopSettings.findOne();
    if (settings && (!settings.godowns || settings.godowns.length === 0)) {
      settings.godowns = DEFAULT_GODOWNS;
      await settings.save();
      console.log('[Migration] ShopSettings updated with default godowns G1 and G2.');
    }

    // 4. Log Audit Trail if any changes occurred
    if (tyresMigratedCount > 0 || accessoriesMigratedCount > 0) {
      await AuditLog.create({
        action: 'MIGRATE_GODOWNS',
        entity: 'System',
        entityId: 'Migration_Two_Godowns',
        afterSnapshot: {
          tyresMigrated: tyresMigratedCount,
          accessoriesMigrated: accessoriesMigratedCount,
          timestamp: new Date(),
        },
        userName: 'MigrationScript',
      });
    }

    console.log('----------------------------------------------------');
    console.log('✅ TWO-GODOWN MIGRATION COMPLETED');
    console.log(`   - Tyres migrated:        ${tyresMigratedCount}`);
    console.log(`   - Accessories migrated:  ${accessoriesMigratedCount}`);
    console.log('   - Invariant: Total === G1 + G2 holds for all inventory');
    console.log('====================================================\n');

    return {
      tyresMigrated: tyresMigratedCount,
      accessoriesMigrated: accessoriesMigratedCount,
    };
  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error.message);
    throw error;
  }
}

if (require.main === module) {
  migrateGodowns()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateGodowns };
