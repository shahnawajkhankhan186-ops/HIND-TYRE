/**
 * End-to-End (E2E) Flow Verification Script with Two-Godown Stock Management
 * Validates: 
 *   Login -> Stock-In to G2 (+5) -> Sale from G2 (-2) -> G2 and total reduced, G1 unchanged 
 *   -> Receipt PDF Streamed -> Cancel Sale -> G2 and total restored -> Ledger records godown entries
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
  console.log('🚀 RUNNING HIND TYRES TWO-GODOWN E2E WORKFLOW');
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
    const tyre = await Tyre.findOne({ isArchived: false, isActive: true }).lean();
    if (!tyre) throw new Error('No active tyre found. Run npm run seed first.');
    const initialG1 = tyre.godownStock?.G1 ?? 0;
    const initialG2 = tyre.godownStock?.G2 ?? 0;
    const initialTotal = tyre.quantity;

    console.log(`✅ Selected tyre: "${tyre.modelName} ${tyre.size}"`);
    console.log(`   Initial Stock -> Total: ${initialTotal} | Godown 1 (G1): ${initialG1} | Godown 2 (G2): ${initialG2}`);
    if (initialTotal !== initialG1 + initialG2) {
      throw new Error(`Initial stock invariant violated: Total (${initialTotal}) != G1 (${initialG1}) + G2 (${initialG2})`);
    }

    // 3. STOCK-IN TO GODOWN 2 (+5 units)
    console.log('\n[Step 3] Performing Stock-In (+5 units) to Godown 2 (G2)...');
    const stockInRes = await request(app)
      .post('/api/admin/stock-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'Tyre',
        itemId: tyre._id.toString(),
        godown: 'G2',
        quantity: 5,
        supplier: 'Apollo Logistics Depot',
        note: 'E2E Automated Test Purchase Batch for G2',
      });

    if (stockInRes.status !== 201) {
      throw new Error(`Stock-in failed: ${JSON.stringify(stockInRes.body)}`);
    }

    const verifyStockIn = await Tyre.findById(tyre._id);
    const expectedG2AfterIn = initialG2 + 5;
    const expectedTotalAfterIn = initialTotal + 5;

    if (verifyStockIn.godownStock.G2 !== expectedG2AfterIn) {
      throw new Error(`G2 stock mismatch after Stock-In: expected ${expectedG2AfterIn}, got ${verifyStockIn.godownStock.G2}`);
    }
    if (verifyStockIn.godownStock.G1 !== initialG1) {
      throw new Error(`G1 stock corrupted during G2 Stock-In: expected ${initialG1}, got ${verifyStockIn.godownStock.G1}`);
    }
    if (verifyStockIn.quantity !== expectedTotalAfterIn) {
      throw new Error(`Total stock mismatch after Stock-In: expected ${expectedTotalAfterIn}, got ${verifyStockIn.quantity}`);
    }
    if (verifyStockIn.quantity !== verifyStockIn.godownStock.G1 + verifyStockIn.godownStock.G2) {
      throw new Error(`Stock invariant violated after Stock-In: Total != G1 + G2`);
    }
    console.log(`✅ Stock-In verified! G2 increased to ${verifyStockIn.godownStock.G2}, G1 unchanged (${verifyStockIn.godownStock.G1}), Total: ${verifyStockIn.quantity}.`);

    // 4. SALE FROM GODOWN 2 (-2 units)
    console.log('\n[Step 4] Executing Sale (-2 units) strictly from Godown 2 (G2)...');
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
        items: [{ tyreId: tyre._id.toString(), quantity: 2, itemType: 'Tyre', godown: 'G2' }],
        paymentMode: 'UPI',
        discountPaise: 0,
      });

    if (saleRes.status !== 201) {
      throw new Error(`Sale failed: ${JSON.stringify(saleRes.body)}`);
    }
    const createdSale = saleRes.body.data;
    console.log(`✅ Sale created successfully! Invoice No: ${createdSale.invoiceNo}`);
    console.log(`   Grand Total: ₹${(createdSale.totalPaise / 100).toFixed(2)}`);
    console.log(`   Sale item godown recorded: ${createdSale.items[0].godown?.code} (${createdSale.items[0].godown?.name})`);

    // Verify stock decreased only in G2 and Total, G1 untouched
    const verifyStockAfterSale = await Tyre.findById(tyre._id);
    const expectedG2AfterSale = expectedG2AfterIn - 2;
    const expectedTotalAfterSale = expectedTotalAfterIn - 2;

    if (verifyStockAfterSale.godownStock.G2 !== expectedG2AfterSale) {
      throw new Error(`G2 stock after sale mismatch: expected ${expectedG2AfterSale}, got ${verifyStockAfterSale.godownStock.G2}`);
    }
    if (verifyStockAfterSale.godownStock.G1 !== initialG1) {
      throw new Error(`G1 stock unexpectedly altered during G2 sale: expected ${initialG1}, got ${verifyStockAfterSale.godownStock.G1}`);
    }
    if (verifyStockAfterSale.quantity !== expectedTotalAfterSale) {
      throw new Error(`Total stock after sale mismatch: expected ${expectedTotalAfterSale}, got ${verifyStockAfterSale.quantity}`);
    }
    if (verifyStockAfterSale.quantity !== verifyStockAfterSale.godownStock.G1 + verifyStockAfterSale.godownStock.G2) {
      throw new Error(`Stock invariant violated after Sale: Total != G1 + G2`);
    }
    console.log(`✅ Stock reduction verified! G2: ${verifyStockAfterSale.godownStock.G2}, G1 unchanged (${verifyStockAfterSale.godownStock.G1}), Total: ${verifyStockAfterSale.quantity}.`);

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

    // 6. CANCEL SALE & RESTORE STOCK TO G2
    console.log('\n[Step 6] Cancelling sale with ConfirmDialog reason...');
    const cancelRes = await request(app)
      .post(`/api/sales/${createdSale._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Customer returned tyre before fitment; warranty card unsealed.' });

    if (cancelRes.status !== 200 || cancelRes.body.data?.status !== 'CANCELLED') {
      throw new Error(`Sale cancellation failed: ${JSON.stringify(cancelRes.body)}`);
    }
    console.log('✅ Sale cancelled successfully!');

    // Verify stock restored to G2 and Total, G1 remains unchanged
    const verifyStockAfterCancel = await Tyre.findById(tyre._id);
    if (verifyStockAfterCancel.godownStock.G2 !== expectedG2AfterIn) {
      throw new Error(`G2 restoration mismatch: expected ${expectedG2AfterIn}, got ${verifyStockAfterCancel.godownStock.G2}`);
    }
    if (verifyStockAfterCancel.godownStock.G1 !== initialG1) {
      throw new Error(`G1 affected during cancellation: expected ${initialG1}, got ${verifyStockAfterCancel.godownStock.G1}`);
    }
    if (verifyStockAfterCancel.quantity !== expectedTotalAfterIn) {
      throw new Error(`Total restoration mismatch: expected ${expectedTotalAfterIn}, got ${verifyStockAfterCancel.quantity}`);
    }
    if (verifyStockAfterCancel.quantity !== verifyStockAfterCancel.godownStock.G1 + verifyStockAfterCancel.godownStock.G2) {
      throw new Error(`Stock invariant violated after Cancel: Total != G1 + G2`);
    }
    console.log(`✅ Stock restoration verified! G2 restored to ${verifyStockAfterCancel.godownStock.G2}, G1 unchanged (${verifyStockAfterCancel.godownStock.G1}), Total: ${verifyStockAfterCancel.quantity}.`);

    // 7. VERIFY STOCK MOVEMENT LEDGER INTEGRITY FOR GODOWN ENTRIES
    console.log('\n[Step 7] Checking StockMovement ledger entries for godown-awareness...');
    const cancelMovement = await StockMovement.findOne({
      reference: createdSale.invoiceNo,
      type: 'SALE_CANCEL',
    });
    if (!cancelMovement) {
      throw new Error('SALE_CANCEL ledger entry not found!');
    }
    if (cancelMovement.godown !== 'G2') {
      throw new Error(`SALE_CANCEL ledger godown mismatch: expected G2, got ${cancelMovement.godown}`);
    }
    if (cancelMovement.godownBefore !== expectedG2AfterSale || cancelMovement.godownAfter !== expectedG2AfterIn) {
      throw new Error(`SALE_CANCEL godownBefore/After incorrect: before=${cancelMovement.godownBefore}, after=${cancelMovement.godownAfter}`);
    }

    const saleMovement = await StockMovement.findOne({
      reference: createdSale.invoiceNo,
      type: 'SALE',
    });
    if (!saleMovement) {
      throw new Error('SALE ledger entry not found!');
    }
    if (saleMovement.godown !== 'G2') {
      throw new Error(`SALE ledger godown mismatch: expected G2, got ${saleMovement.godown}`);
    }

    console.log(`✅ Ledger verified!`);
    console.log(`   - SALE entry:        -${Math.abs(saleMovement.qty)} units | Godown: ${saleMovement.godown} (${saleMovement.godownBefore} -> ${saleMovement.godownAfter})`);
    console.log(`   - SALE_CANCEL entry: +${cancelMovement.qty} units | Godown: ${cancelMovement.godown} (${cancelMovement.godownBefore} -> ${cancelMovement.godownAfter})`);

    console.log('\n====================================================');
    console.log('🎉 ALL TWO-GODOWN E2E VERIFICATION STEPS PASSED!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

runE2E();
