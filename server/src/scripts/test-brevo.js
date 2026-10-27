const { sendInvoiceEmail } = require('../utils/mailer');
const { generateInvoicePDF } = require('../utils/pdfInvoice');
const config = require('../config/env');

async function runTest() {
  console.log('=== BREVO EMAIL INTEGRATION TEST ===');
  console.log('Configured Brevo API Key:', config.BREVO.API_KEY ? 'Present (***)' : 'Not set (Mock mode)');
  console.log('Configured Brevo Sender:', config.BREVO.SENDER_EMAIL || 'Not set');
  console.log('Configured Brevo Sender Name:', config.BREVO.SENDER_NAME);

  const mockSale = {
    invoiceNo: 'HT-TEST-20261027-0001',
    createdAt: new Date(),
    paymentMode: 'UPI',
    paymentStatus: 'PAID',
    customerSnapshot: {
      name: 'Ramesh Sharma',
      phone: '9876543210',
      email: 'customer.test@example.com',
      vehicleNumber: 'UP78-AB-9999',
      vehicleModel: 'Maruti Suzuki Dzire',
    },
    soldBy: {
      name: 'Admin Shahnawaj',
      email: 'admin.seller@example.com',
    },
    items: [
      {
        name: 'Apollo Amazer 4G Life 165/80 R14',
        size: '165/80 R14',
        brand: 'Apollo',
        itemType: 'Tyre',
        qty: 2,
        unitPricePaise: 380000,
        lineTotalPaise: 760000,
      },
    ],
    subtotalPaise: 593750,
    gstPaise: 166250,
    discountPaise: 0,
    totalPaise: 760000,
  };

  const settings = {
    shopName: 'HIND TYRES & ACCESSORIES',
    address: 'GT Road Bypass, Transport Nagar, Kanpur, UP',
    phone: '+91 98765 43210',
    email: 'contact@hindtyres.com',
    gstin: '09AAACH7409R1ZZ',
  };

  console.log('\n1. Generating in-memory invoice PDF with QR code...');
  const pdfBuffer = await generateInvoicePDF({ sale: mockSale, settings });
  console.log(`✓ PDF Generated successfully! Buffer size: ${pdfBuffer.length} bytes`);

  console.log('\n2. Testing email dispatch to Buyer (customer)...');
  const buyerResult = await sendInvoiceEmail({
    recipientEmail: mockSale.customerSnapshot.email,
    recipientName: mockSale.customerSnapshot.name,
    sale: mockSale,
    pdfBuffer,
    recipientType: 'customer',
    sellerInfo: { name: mockSale.soldBy.name, email: mockSale.soldBy.email },
    shopSettings: settings,
  });
  console.log('Buyer dispatch result:', buyerResult);

  console.log('\n3. Testing email dispatch to Seller (admin who made the sale)...');
  const sellerResult = await sendInvoiceEmail({
    recipientEmail: mockSale.soldBy.email,
    recipientName: mockSale.soldBy.name,
    sale: mockSale,
    pdfBuffer,
    recipientType: 'seller',
    sellerInfo: { name: mockSale.soldBy.name, email: mockSale.soldBy.email },
    shopSettings: settings,
  });
  console.log('Seller dispatch result:', sellerResult);

  console.log('\n=== TEST SUMMARY ===');
  if (buyerResult.success && sellerResult.success) {
    console.log('✓ SUCCESS: Both Buyer and Seller receipt emails handled cleanly without error!');
  } else {
    console.error('✗ FAILURE in email dispatch');
  }
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
