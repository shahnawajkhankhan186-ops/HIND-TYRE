/**
 * End-to-End (E2E) Flow Verification Script
 * Validates: Login -> Stock-In -> Sale -> Stock Reduced -> PDF Generated -> Cancel -> Stock Restored
 */

const { connectDB } = require('../server/src/config/db');
const User = require('../server/src/models/User');
const Tyre = require('../server/src/models/Tyre');
const Sale = require('../server/src/models/Sale');
const StockMovement = require('../server/src/models/StockMovement');
const app = require('../server/src/app');
const request = require('../server/node_modules/supertest');

async function runE2E() {
  console.log('====================================================');
  console.log('🚀 RUNNING HIND TYRES E2E WORKFLOW VERIFICATION');
  console.log('====================================================');

  try {
    await connectDB();

    // 1. LOGIN ADMIN
    console.log('\n[Step 1] Logging in as Admin...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hindtyres.com', password: 'Admin@123' });

    if (loginRes.status !== 200 || !loginRes.body.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.body)}`);
    }
    const adminToken = loginRes.body.data.token;
    console.log('✅ Admin login successful! Token acquired.');

    // 2. FIND A TYRE FOR E2E TEST
    console.log('\n[Step 2] Finding test tyre in catalog...');
    const tyre = await Tyre.findOne({ isArchived: false, isActive: true });
    if (!tyre) throw new Error('No active tyre found. Run npm run seed first.');
    const initialStock = tyre.quantity;
    console.log(`✅ Selected tyre: "${tyre.modelName} ${tyre.size}" (Current Stock: ${initialStock})`);

    // 3. STOCK-IN (PURCHASE ENTRY)
    console.log('\n[Step 3] Performing Stock-In (+5 units)...');
    const stockInRes = await request(app)
      .post('/api/admin/stock-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'Tyre',
        itemId: tyre._id.toString(),
        quantity: 5,
        supplier: 'Apollo Logistics Depot',
        note: 'E2E Automated Test Purchase Batch',
      });

    if (stockInRes.status !== 201) {
      throw new Error(`Stock-in failed: ${JSON.stringify(stockInRes.body)}`);
    }
    const stockAfterIn = initialStock + 5;
    const verifyStockIn = await Tyre.findById(tyre._id);
    if (verifyStockIn.quantity !== stockAfterIn) {
      throw new Error(`Stock quantity mismatch: expected ${stockAfterIn}, got ${verifyStockIn.quantity}`);
    }
    console.log(`✅ Stock-In verified! Stock increased to ${verifyStockIn.quantity}.`);

    // 4. SALE (BILLING 2 UNITS)
    console.log('\n[Step 4] Executing Sale (-2 units)...');
    const saleRes = await request(app)
      .post('/api/counter/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: {
          name: 'Vikram Malhotra',
          phone: '9876543210',
          email: 'vikram@example.com',
          address: 'Plot 45, Mall Road, Kanpur',
          vehicleNumber: 'UP-78-BK-1001',
          vehicleModel: 'Honda City',
        },
        items: [{ tyreId: tyre._id.toString(), quantity: 2, itemType: 'Tyre' }],
        paymentMode: 'UPI',
        discountPaise: 0,
      });

    if (saleRes.status !== 201) {
      throw new Error(`Sale failed: ${JSON.stringify(saleRes.body)}`);
    }
    const createdSale = saleRes.body.data;
    console.log(`✅ Sale created successfully! Invoice No: ${createdSale.invoiceNo}`);
    console.log(`   Grand Total: ₹${(createdSale.totalPaise / 100).toFixed(2)}`);

    // Verify stock decreased
    const verifyStockAfterSale = await Tyre.findById(tyre._id);
    const expectedAfterSale = stockAfterIn - 2;
    if (verifyStockAfterSale.quantity !== expectedAfterSale) {
      throw new Error(`Stock after sale mismatch: expected ${expectedAfterSale}, got ${verifyStockAfterSale.quantity}`);
    }
    console.log(`✅ Stock reduction verified! Current Stock: ${verifyStockAfterSale.quantity}`);

    // 5. RECEIPT PDF GENERATION & STREAMING
    console.log('\n[Step 5] Downloading in-memory receipt PDF...');
    const pdfRes = await request(app)
      .get(`/api/sales/${createdSale._id}/receipt.pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    if (pdfRes.status !== 200) {
      throw new Error(`PDF download failed: ${pdfRes.status}`);
    }
    if (pdfRes.headers['content-type'] !== 'application/pdf') {
      throw new Error(`Invalid content-type: ${pdfRes.headers['content-type']}`);
    }
    if (!pdfRes.body || pdfRes.body.length < 500) {
      throw new Error(`PDF buffer too small or empty (${pdfRes.body?.length} bytes)`);
    }
    console.log(`✅ PDF receipt generated in memory! Size: ${pdfRes.body.length} bytes.`);

    // 6. CANCEL SALE & RESTORE STOCK
    console.log('\n[Step 6] Cancelling sale with ConfirmDialog reason...');
    const cancelRes = await request(app)
      .post(`/api/sales/${createdSale._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Customer returned tyre before fitment; warranty card unsealed.' });

    if (cancelRes.status !== 200 || cancelRes.body.data?.status !== 'CANCELLED') {
      throw new Error(`Sale cancellation failed: ${JSON.stringify(cancelRes.body)}`);
    }
    console.log('✅ Sale cancelled successfully!');

    // Verify stock restored
    const verifyStockAfterCancel = await Tyre.findById(tyre._id);
    if (verifyStockAfterCancel.quantity !== stockAfterIn) {
      throw new Error(`Stock restoration mismatch: expected ${stockAfterIn}, got ${verifyStockAfterCancel.quantity}`);
    }
    console.log(`✅ Stock restoration verified! Current Stock: ${verifyStockAfterCancel.quantity}`);

    // 7. VERIFY STOCK MOVEMENT LEDGER INTEGRITY
    console.log('\n[Step 7] Checking StockMovement ledger entries...');
    const cancelMovement = await StockMovement.findOne({
      reference: createdSale.invoiceNo,
      type: 'SALE_CANCEL',
    });
    if (!cancelMovement) {
      throw new Error('SALE_CANCEL ledger entry not found!');
    }
    console.log(`✅ Ledger verified! Movement logged: +${cancelMovement.qty} units (ref: ${cancelMovement.reference})`);

    console.log('\n====================================================');
    console.log('🎉 ALL E2E VERIFICATION STEPS PASSED SUCCESSFULLY!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

runE2E();
