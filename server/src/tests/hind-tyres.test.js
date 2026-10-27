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
      purchasePricePaise: 300000, // ₹3,000.00
      sellingPricePaise: 400000,  // ₹4,000.00
      mrpPaise: 450000,
      gstPercent: 28,
      quantity: 20,
    });
  });

  test('should calculate subtotal and total accurately in integer paise', async () => {
    const qty = 2;
    const result = await pricingService.computeSalePricing({
      items: [{ tyreId: tyreDoc._id, quantity: qty, itemType: 'Tyre' }],
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
        items: [{ tyreId: tyreDoc._id, quantity: 2, itemType: 'Tyre' }],
        discountPaise: excessiveDiscountPaise,
      })
    ).rejects.toThrow(/Discount cannot exceed maximum policy/);
  });

  test('should allow valid discount within policy limit', async () => {
    const validDiscountPaise = 50000; // ₹500 (< 15%)
    const result = await pricingService.computeSalePricing({
      items: [{ tyreId: tyreDoc._id, quantity: 2, itemType: 'Tyre' }],
      discountPaise: validDiscountPaise,
    });

    expect(result.discountPaise).toBe(validDiscountPaise);
    expect(result.totalPaise).toBe(result.subtotalPaise - validDiscountPaise);
  });
});

describe('2. Stock Concurrency (Atomic Transactions & Over-selling Protection)', () => {
  let limitedTyre;

  beforeEach(async () => {
    // Create tyre with exactly 1 unit in stock
    limitedTyre = await Tyre.create({
      companyId: testCompany._id,
      modelName: 'Last Tyre In Stock',
      size: '205/55 R16',
      vehicleType: 'Car',
      sku: `CONCURRENCY-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      purchasePricePaise: 350000,
      sellingPricePaise: 500000,
      mrpPaise: 600000,
      gstPercent: 28,
      quantity: 1, // EXACTLY 1 in stock!
      lowStockThreshold: 1,
    });
  });

  test('two simultaneous sales for the last tyre -> exactly one succeeds, one fails with 409, stock never goes negative', async () => {
    const salePayload1 = {
      customer: {
        name: 'Buyer Alpha',
        phone: '9888877771',
        email: 'alpha@example.com',
        address: 'Kanpur Bypass 1',
      },
      items: [{ tyreId: limitedTyre._id.toString(), quantity: 1, itemType: 'Tyre' }],
      paymentMode: 'CASH',
    };

    const salePayload2 = {
      customer: {
        name: 'Buyer Beta',
        phone: '9888877772',
        email: 'beta@example.com',
        address: 'Kanpur Bypass 2',
      },
      items: [{ tyreId: limitedTyre._id.toString(), quantity: 1, itemType: 'Tyre' }],
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

    // Verify tyre stock in database is exactly 0 (never negative!)
    const updatedTyre = await Tyre.findById(limitedTyre._id);
    expect(updatedTyre.quantity).toBe(0);

    // Verify StockMovement recorded exactly 1 sale deduction of -1
    const movements = await StockMovement.find({
      itemId: limitedTyre._id,
      type: 'SALE',
    });
    expect(movements.length).toBe(1);
    expect(movements[0].qty).toBe(-1);
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
      sku: `RESTORE-${Date.now()}`,
      purchasePricePaise: 180000,
      sellingPricePaise: 250000,
      mrpPaise: 300000,
      gstPercent: 28,
      quantity: 10, // Starts at 10
      lowStockThreshold: 2,
    });

    // Make a sale of 2 units
    const saleRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${counterToken}`)
      .send({
        customer: {
          name: 'Sunil Kumar',
          phone: '9911223344',
          email: 'sunil@test.com',
          address: 'Civil Lines, Kanpur',
        },
        items: [{ tyreId: tyreDoc._id.toString(), quantity: 2, itemType: 'Tyre' }],
        paymentMode: 'CARD',
      });

    expect(saleRes.status).toBe(201);
    createdSale = saleRes.body.data;

    // Stock should now be 8
    const checkStock = await Tyre.findById(tyreDoc._id);
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

    // Check stock restored back to 10
    const restoredTyre = await Tyre.findById(tyreDoc._id);
    expect(restoredTyre.quantity).toBe(10);

    // Verify SALE_CANCEL movement in ledger
    const cancelMovement = await StockMovement.findOne({
      itemId: tyreDoc._id,
      type: 'SALE_CANCEL',
      reference: createdSale.invoiceNo,
    });

    expect(cancelMovement).not.toBeNull();
    expect(cancelMovement.qty).toBe(2);
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
