const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { connectDB } = require('../config/db');
const config = require('../config/env');
const User = require('../models/User');
const Company = require('../models/Company');
const Tyre = require('../models/Tyre');
const Accessory = require('../models/Accessory');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const ShopSettings = require('../models/ShopSettings');
const pricingService = require('../services/pricing.service');
const stockService = require('../services/stock.service');
const { migrateGodowns } = require('../scripts/migrateGodowns');

let adminToken;
let counterToken;
let adminUser;
let counterUser;
let testCompany;

beforeAll(async () => {
  await connectDB();

  // Create test shop settings
  await ShopSettings.findOneAndUpdate(
    {},
    {
      shopName: 'HIND TYRES TEST',
      maxDiscountPercent: 15,
      defaultGstPercent: 28,
      godowns: [
        { code: 'G1', name: 'Godown 1' },
        { code: 'G2', name: 'Godown 2' },
      ],
    },
    { upsert: true, new: true }
  );

  // Setup test users
  adminUser = await User.findOneAndUpdate(
    { email: 'test_admin@hindtyres.com' },
    {
      name: 'Test Admin',
      email: 'test_admin@hindtyres.com',
      passwordHash: 'dummyhash',
      role: 'ADMIN',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  counterUser = await User.findOneAndUpdate(
    { email: 'test_counter@hindtyres.com' },
    {
      name: 'Test Counter',
      email: 'test_counter@hindtyres.com',
      passwordHash: 'dummyhash',
      role: 'COUNTER',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, config.JWT_SECRET);
  counterToken = jwt.sign({ id: counterUser._id, role: counterUser.role }, config.JWT_SECRET);

  testCompany = await Company.findOneAndUpdate(
    { name: 'MRF Test' },
    { name: 'MRF Test', isActive: true, isArchived: false },
    { upsert: true, new: true }
  );
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('1. Pricing Engine & Financial Calculations (Integer Paise)', () => {
  let tyreDoc;

  beforeAll(async () => {
    tyreDoc = await Tyre.create({
      companyId: testCompany._id,
      modelName: 'Test Radial Pricing',
      size: '185/65 R15',
      vehicleType: 'Car',
      sku: `TEST-PRICE-${Date.now()}`,
      materialNumber: `MAT-PRICE-${Date.now()}`,
      purchasePricePaise: 300000, // ₹3,000.00
      sellingPricePaise: 400000,  // ₹4,000.00
      mrpPaise: 450000,
      gstPercent: 28,
      godownStock: { G1: 20, G2: 0 },
      quantity: 20,
    });
  });

  test('should calculate subtotal and total accurately in integer paise', async () => {
    const qty = 2;
    const result = await pricingService.computeSalePricing({
      items: [{ tyreId: tyreDoc._id, quantity: qty, itemType: 'Tyre', godown: 'G1' }],
      discountPaise: 0,
    });

    const expectedSubtotal = 400000 * 2; // 800000 paise (₹8,000)
    const expectedTotal = expectedSubtotal; // 800000 paise (₹8,000)

    expect(result.subtotalPaise).toBe(expectedSubtotal);
    expect(result.gstPaise).toBe(0);
    expect(result.totalPaise).toBe(expectedTotal);
    expect(result.items[0].unitPricePaise).toBe(400000);
    expect(result.items[0].lineTotalPaise).toBe(expectedTotal);
  });

  test('should reject discount that exceeds max policy percent (15%)', async () => {
    // 800000 paise subtotal * 15% = 120000 paise max allowed discount
    const excessiveDiscountPaise = 150000; // ₹1,500 (> 15%)

    await expect(
      pricingService.computeSalePricing({
        items: [{ tyreId: tyreDoc._id, quantity: 2, itemType: 'Tyre', godown: 'G1' }],
        discountPaise: excessiveDiscountPaise,
      })
    ).rejects.toThrow(/Discount cannot exceed maximum policy/);
  });

  test('should allow valid discount within policy limit', async () => {
    const validDiscountPaise = 50000; // ₹500 (< 15%)
    const result = await pricingService.computeSalePricing({
      items: [{ tyreId: tyreDoc._id, quantity: 2, itemType: 'Tyre', godown: 'G1' }],
      discountPaise: validDiscountPaise,
    });

    expect(result.discountPaise).toBe(validDiscountPaise);
    expect(result.totalPaise).toBe(result.subtotalPaise - validDiscountPaise);
  });
});

describe('2. Stock Concurrency (Atomic Transactions & Over-selling Protection)', () => {
  let limitedTyre;

  beforeEach(async () => {
    // Create tyre with exactly 1 unit in G1 stock
    limitedTyre = await Tyre.create({
      companyId: testCompany._id,
      modelName: 'Last Tyre In Stock',
      size: '205/55 R16',
      vehicleType: 'Car',
      sku: `CONCURRENCY-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      materialNumber: `MAT-CONCUR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      purchasePricePaise: 350000,
      sellingPricePaise: 500000,
      mrpPaise: 600000,
      gstPercent: 28,
      godownStock: { G1: 1, G2: 0 },
      quantity: 1, // EXACTLY 1 in G1!
      lowStockThreshold: 1,
    });
  });

  test('two simultaneous sales for the last tyre in G1 -> exactly one succeeds, one fails with 409, stock never goes negative', async () => {
    const salePayload1 = {
      customer: {
        name: 'Buyer Alpha',
        phone: '9888877771',
        email: 'alpha@example.com',
        address: 'Ramgarh Bypass 1',
      },
      items: [{ tyreId: limitedTyre._id.toString(), quantity: 1, itemType: 'Tyre', godown: 'G1' }],
      paymentMode: 'CASH',
    };

    const salePayload2 = {
      customer: {
        name: 'Buyer Beta',
        phone: '9888877772',
        email: 'beta@example.com',
        address: 'Ramgarh Bypass 2',
      },
      items: [{ tyreId: limitedTyre._id.toString(), quantity: 1, itemType: 'Tyre', godown: 'G1' }],
      paymentMode: 'UPI',
    };

    // Execute both sales concurrently!
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/counter/sales')
        .set('Authorization', `Bearer ${counterToken}`)
        .send(salePayload1),
      request(app)
        .post('/api/counter/sales')
        .set('Authorization', `Bearer ${counterToken}`)
        .send(salePayload2),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201); // Exactly one succeeded
    expect(statuses).toContain(409); // Exactly one rejected with 409 Conflict

    // Verify tyre stock in database is exactly 0 in G1, 0 total (never negative!)
    const updatedTyre = await Tyre.findById(limitedTyre._id);
    expect(updatedTyre.godownStock.G1).toBe(0);
    expect(updatedTyre.quantity).toBe(0);

    // Verify StockMovement recorded exactly 1 sale deduction of -1 with godown G1
    const movements = await StockMovement.find({
      itemId: limitedTyre._id,
      type: 'SALE',
    });
    expect(movements.length).toBe(1);
    expect(movements[0].qty).toBe(-1);
    expect(movements[0].godown).toBe('G1');
    expect(movements[0].godownBefore).toBe(1);
    expect(movements[0].godownAfter).toBe(0);
    expect(movements[0].quantityBefore).toBe(1);
    expect(movements[0].quantityAfter).toBe(0);
  });
});

describe('3. Sale Cancellation & Inventory Restoration', () => {
  let tyreDoc;
  let createdSale;

  beforeEach(async () => {
    tyreDoc = await Tyre.create({
      companyId: testCompany._id,
      modelName: 'Tyre For Return Test',
      size: '145/80 R12',
      vehicleType: 'Car',
      sku: `RESTORE-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      materialNumber: `MAT-RESTORE-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      purchasePricePaise: 180000,
      sellingPricePaise: 250000,
      mrpPaise: 300000,
      gstPercent: 28,
      godownStock: { G1: 10, G2: 0 },
      quantity: 10, // Starts at 10
      lowStockThreshold: 2,
    });

    // Make a sale of 2 units from G1
    const saleRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${counterToken}`)
      .send({
        customer: {
          name: 'Sunil Kumar',
          phone: '9911223344',
          email: 'sunil@test.com',
          address: 'Civil Lines, Ramgarh',
        },
        items: [{ tyreId: tyreDoc._id.toString(), quantity: 2, itemType: 'Tyre', godown: 'G1' }],
        paymentMode: 'CARD',
      });

    expect(saleRes.status).toBe(201);
    createdSale = saleRes.body.data;

    // Stock should now be 8 in G1 and 8 total
    const checkStock = await Tyre.findById(tyreDoc._id);
    expect(checkStock.godownStock.G1).toBe(8);
    expect(checkStock.quantity).toBe(8);
  });

  test('cancelling a sale restores stock transactionally and logs SALE_CANCEL movement', async () => {
    const cancelRes = await request(app)
      .post(`/api/sales/${createdSale._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Customer changed mind and returned tyres in mint condition' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
    expect(cancelRes.body.data.cancelReason).toBe(
      'Customer changed mind and returned tyres in mint condition'
    );

    // Check stock restored back to 10 in G1 and total
    const restoredTyre = await Tyre.findById(tyreDoc._id);
    expect(restoredTyre.godownStock.G1).toBe(10);
    expect(restoredTyre.quantity).toBe(10);

    // Verify SALE_CANCEL movement in ledger
    const cancelMovement = await StockMovement.findOne({
      itemId: tyreDoc._id,
      type: 'SALE_CANCEL',
      reference: createdSale.invoiceNo,
    });

    expect(cancelMovement).not.toBeNull();
    expect(cancelMovement.qty).toBe(2);
    expect(cancelMovement.godown).toBe('G1');
    expect(cancelMovement.godownBefore).toBe(8);
    expect(cancelMovement.godownAfter).toBe(10);
    expect(cancelMovement.quantityBefore).toBe(8);
    expect(cancelMovement.quantityAfter).toBe(10);
  });

  test('cancelling an already cancelled sale returns 400 error', async () => {
    // First cancellation
    await request(app)
      .post(`/api/sales/${createdSale._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'First cancel' });

    // Second cancellation attempt
    const secondCancel = await request(app)
      .post(`/api/sales/${createdSale._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Duplicate cancel' });

    expect(secondCancel.status).toBe(400);
    expect(secondCancel.body.error).toMatch(/already cancelled/);
  });
});

describe('4. Two-Godown Stock Management, Isolation & Transfer', () => {
  let splitTyre;

  beforeEach(async () => {
    splitTyre = await Tyre.create({
      companyId: testCompany._id,
      modelName: 'Two Godown Isolation Radial',
      size: '195/65 R15',
      vehicleType: 'Car',
      sku: `GODOWN-ISO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      materialNumber: `MAT-ISO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      purchasePricePaise: 320000,
      sellingPricePaise: 450000,
      mrpPaise: 500000,
      gstPercent: 28,
      godownStock: { G1: 10, G2: 8 },
      quantity: 18,
    });
  });

  test('deduction from G1 only affects G1 and total; G2 remains untouched', async () => {
    const saleRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${counterToken}`)
      .send({
        customer: {
          name: 'Pooja Verma',
          phone: '9876501234',
          email: 'pooja@example.com',
          address: 'Gola Road, Ramgarh',
        },
        items: [{ tyreId: splitTyre._id.toString(), quantity: 3, itemType: 'Tyre', godown: 'G1' }],
        paymentMode: 'UPI',
      });

    expect(saleRes.status).toBe(201);

    const updated = await Tyre.findById(splitTyre._id);
    expect(updated.godownStock.G1).toBe(7);  // 10 - 3
    expect(updated.godownStock.G2).toBe(8);  // G2 strictly UNTOUCHED
    expect(updated.quantity).toBe(15);       // Total 18 - 3 = 15
    expect(updated.quantity).toBe(updated.godownStock.G1 + updated.godownStock.G2);

    // Ledger check
    const movement = await StockMovement.findOne({
      itemId: splitTyre._id,
      type: 'SALE',
      reference: saleRes.body.data.invoiceNo,
    });
    expect(movement).not.toBeNull();
    expect(movement.godown).toBe('G1');
    expect(movement.qty).toBe(-3);
    expect(movement.godownBefore).toBe(10);
    expect(movement.godownAfter).toBe(7);
    expect(movement.quantityBefore).toBe(18);
    expect(movement.quantityAfter).toBe(15);
  });

  test('insufficient stock in the chosen godown returns 409 even if the OTHER godown has stock', async () => {
    // G1 has 10, G2 has 8. Request 9 units from G2 -> should succeed. But request 12 units from G2 -> fail even though total is 18!
    const saleRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${counterToken}`)
      .send({
        customer: {
          name: 'Ashok Mishra',
          phone: '9876543299',
          email: 'ashok@example.com',
          address: 'Subhash Chowk, Ramgarh',
        },
        items: [{ tyreId: splitTyre._id.toString(), quantity: 12, itemType: 'Tyre', godown: 'G2' }],
        paymentMode: 'CASH',
      });

    expect(saleRes.status).toBe(409);
    expect(saleRes.body.error).toMatch(/Insufficient stock in Godown 2/);

    // Verify stock remains intact
    const intact = await Tyre.findById(splitTyre._id);
    expect(intact.godownStock.G1).toBe(10);
    expect(intact.godownStock.G2).toBe(8);
    expect(intact.quantity).toBe(18);
  });

  test('cancellation restores to the original godown recorded on each sale item', async () => {
    // Sell 4 units from G2
    const saleRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${counterToken}`)
      .send({
        customer: {
          name: 'Ramesh Gupta',
          phone: '9812345678',
          email: 'ramesh@example.com',
          address: 'Bus Stand, Ramgarh',
        },
        items: [{ tyreId: splitTyre._id.toString(), quantity: 4, itemType: 'Tyre', godown: 'G2' }],
        paymentMode: 'CASH',
      });

    expect(saleRes.status).toBe(201);
    const saleId = saleRes.body.data._id;

    // After sale: G1=10, G2=4, Total=14
    let currentTyre = await Tyre.findById(splitTyre._id);
    expect(currentTyre.godownStock.G1).toBe(10);
    expect(currentTyre.godownStock.G2).toBe(4);
    expect(currentTyre.quantity).toBe(14);

    // Cancel sale
    const cancelRes = await request(app)
      .post(`/api/sales/${saleId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Customer vehicle cancelled order before fitment' });

    expect(cancelRes.status).toBe(200);

    // Restored: G2 back to 8, G1 remains 10, Total back to 18
    const restored = await Tyre.findById(splitTyre._id);
    expect(restored.godownStock.G1).toBe(10);
    expect(restored.godownStock.G2).toBe(8);
    expect(restored.quantity).toBe(18);

    const cancelMovement = await StockMovement.findOne({
      itemId: splitTyre._id,
      type: 'SALE_CANCEL',
      reference: saleRes.body.data.invoiceNo,
    });
    expect(cancelMovement.godown).toBe('G2');
    expect(cancelMovement.godownBefore).toBe(4);
    expect(cancelMovement.godownAfter).toBe(8);
  });

  test('transfer keeps total quantity unchanged and writes TRANSFER_OUT and TRANSFER_IN ledger entries', async () => {
    // Transfer 4 units from G1 to G2 (starting: G1=10, G2=8, Total=18)
    const transferRes = await request(app)
      .post('/api/admin/stock-transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'Tyre',
        itemId: splitTyre._id.toString(),
        fromGodown: 'G1',
        toGodown: 'G2',
        quantity: 4,
        note: 'Inter-warehouse stock rebalancing for peak festival season',
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.success).toBe(true);

    const afterTransfer = await Tyre.findById(splitTyre._id);
    expect(afterTransfer.godownStock.G1).toBe(6);  // 10 - 4
    expect(afterTransfer.godownStock.G2).toBe(12); // 8 + 4
    expect(afterTransfer.quantity).toBe(18);       // TOTAL UNCHANGED!
    expect(afterTransfer.quantity).toBe(afterTransfer.godownStock.G1 + afterTransfer.godownStock.G2);

    // Verify TRANSFER_OUT
    const outMove = await StockMovement.findOne({
      itemId: splitTyre._id,
      type: 'TRANSFER_OUT',
    });
    expect(outMove).not.toBeNull();
    expect(outMove.godown).toBe('G1');
    expect(outMove.qty).toBe(-4);
    expect(outMove.godownBefore).toBe(10);
    expect(outMove.godownAfter).toBe(6);
    expect(outMove.quantityBefore).toBe(18);
    expect(outMove.quantityAfter).toBe(18);

    // Verify TRANSFER_IN
    const inMove = await StockMovement.findOne({
      itemId: splitTyre._id,
      type: 'TRANSFER_IN',
    });
    expect(inMove).not.toBeNull();
    expect(inMove.godown).toBe('G2');
    expect(inMove.qty).toBe(4);
    expect(inMove.godownBefore).toBe(8);
    expect(inMove.godownAfter).toBe(12);
    expect(inMove.quantityBefore).toBe(18);
    expect(inMove.quantityAfter).toBe(18);
  });

  test('invariant quantity === G1 + G2 holds across all stock-in, deduction, adjust, and transfer operations', async () => {
    const testDoc = await Tyre.create({
      companyId: testCompany._id,
      modelName: 'Invariant Verification Tyre',
      size: '175/65 R14',
      vehicleType: 'Car',
      sku: `INVARIANT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      materialNumber: `MAT-INV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      purchasePricePaise: 250000,
      sellingPricePaise: 350000,
      mrpPaise: 400000,
      gstPercent: 28,
      godownStock: { G1: 10, G2: 10 },
      quantity: 20,
    });
    expect(testDoc.quantity).toBe(testDoc.godownStock.G1 + testDoc.godownStock.G2);

    // 1. Stock-In 5 to G2
    const inRes = await request(app)
      .post('/api/admin/stock-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'Tyre',
        itemId: testDoc._id.toString(),
        godown: 'G2',
        quantity: 5,
        supplier: 'Apollo Logistics',
        note: 'Stock-in invariant check',
      });
    expect(inRes.status).toBe(201);
    let doc = await Tyre.findById(testDoc._id);
    expect(doc.godownStock.G1).toBe(10);
    expect(doc.godownStock.G2).toBe(15);
    expect(doc.quantity).toBe(25);
    expect(doc.quantity).toBe(doc.godownStock.G1 + doc.godownStock.G2);

    // 2. Adjust G1 to 8
    const adjRes = await request(app)
      .post('/api/admin/stock-adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'Tyre',
        itemId: testDoc._id.toString(),
        godown: 'G1',
        newGodownStock: 8,
        reason: 'Physical shelf count audit correction',
      });
    expect(adjRes.status).toBe(200);
    doc = await Tyre.findById(testDoc._id);
    expect(doc.godownStock.G1).toBe(8);
    expect(doc.godownStock.G2).toBe(15);
    expect(doc.quantity).toBe(23);
    expect(doc.quantity).toBe(doc.godownStock.G1 + doc.godownStock.G2);

    // 3. Transfer 3 from G2 to G1
    const trRes = await request(app)
      .post('/api/admin/stock-transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'Tyre',
        itemId: testDoc._id.toString(),
        fromGodown: 'G2',
        toGodown: 'G1',
        quantity: 3,
        note: 'Balancing stock',
      });
    expect(trRes.status).toBe(200);
    doc = await Tyre.findById(testDoc._id);
    expect(doc.godownStock.G1).toBe(11);
    expect(doc.godownStock.G2).toBe(12);
    expect(doc.quantity).toBe(23);
    expect(doc.quantity).toBe(doc.godownStock.G1 + doc.godownStock.G2);

    // 4. Sale 4 from G1
    const sRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${counterToken}`)
      .send({
        customer: {
          name: 'Naveen Jindal',
          phone: '9988776655',
          email: 'naveen@test.com',
          address: 'Station Road, Ramgarh',
        },
        items: [{ tyreId: testDoc._id.toString(), quantity: 4, itemType: 'Tyre', godown: 'G1' }],
        paymentMode: 'CASH',
      });
    expect(sRes.status).toBe(201);
    doc = await Tyre.findById(testDoc._id);
    expect(doc.godownStock.G1).toBe(7);
    expect(doc.godownStock.G2).toBe(12);
    expect(doc.quantity).toBe(19);
    expect(doc.quantity).toBe(doc.godownStock.G1 + doc.godownStock.G2);

    // 5. Cancel Sale
    const cRes = await request(app)
      .post(`/api/sales/${sRes.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Incorrect fitment requested' });
    expect(cRes.status).toBe(200);
    doc = await Tyre.findById(testDoc._id);
    expect(doc.godownStock.G1).toBe(11);
    expect(doc.godownStock.G2).toBe(12);
    expect(doc.quantity).toBe(23);
    expect(doc.quantity).toBe(doc.godownStock.G1 + doc.godownStock.G2);
  });

  test('migration script is idempotent (running twice changes nothing)', async () => {
    // Run migration first time
    const run1 = await migrateGodowns();
    expect(run1).toBeDefined();

    // Run migration second time - all docs already have godownStock so 0 must be modified
    const run2 = await migrateGodowns();
    expect(run2.tyresMigrated).toBe(0);
    expect(run2.accessoriesMigrated).toBe(0);
  });
});
