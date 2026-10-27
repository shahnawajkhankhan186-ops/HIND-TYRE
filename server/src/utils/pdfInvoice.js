const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { formatIST } = require('./ist-date');
const { formatRupees, paiseToWordsINR } = require('./currency');

/**
 * Generate Invoice PDF strictly in-memory (Buffer).
 * No temporary files written to disk.
 */
async function generateInvoicePDF({ sale, settings }) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Invoice - ${sale.invoiceNo}`,
          Author: settings?.shopName || 'HIND TYRES AND ACCESSORIES',
          Subject: 'Invoice & Tyre Warranty Receipt',
        },
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // Generate in-memory QR Code Buffer
      const qrData = JSON.stringify({
        invoice: sale.invoiceNo,
        date: formatIST(sale.createdAt),
        total: formatRupees(sale.totalPaise),
        shop: settings?.shopName || 'HIND TYRES AND ACCESSORIES',
        customer: sale.customerSnapshot?.name,
        phone: sale.customerSnapshot?.phone,
      });

      let qrBuffer = null;
      try {
        qrBuffer = await QRCode.toBuffer(qrData, {
          width: 90,
          margin: 1,
          color: { dark: '#111827', light: '#FFFFFF' },
        });
      } catch (e) {
        console.error('QR code generation warning:', e.message);
      }

      const primaryColor = '#0A0A0C';
      const accentYellow = '#FFC107';
      const textColor = '#111318';
      const lightGray = '#F4F5F7';
      const borderColor = '#E3E5E9';

      // --- Header Banner ---
      doc.rect(36, 36, 523, 76).fill(primaryColor);

      doc.fillColor(accentYellow).fontSize(18).font('Helvetica-Bold');
      doc.text(settings?.shopName || 'HIND TYRES AND ACCESSORIES', 50, 48);

      doc.fillColor('#A9AEB8').fontSize(9).font('Helvetica');
      doc.text(
        `${settings?.address || 'GT Road Bypass, Transport Nagar, Kanpur, UP'}`,
        50,
        72
      );
      doc.text(
        `Phone: ${settings?.phone || '+91 98765 43210'} | Email: ${settings?.email || 'contact@hindtyres.com'}`,
        50,
        86
      );

      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold');
      doc.text('RETAIL INVOICE', 430, 48, { align: 'right', width: 115 });

      // --- Invoice Meta & Customer Details Box ---
      const detailsTop = 120;
      doc.rect(36, detailsTop, 523, 90).strokeColor(borderColor).stroke();

      // Left: Customer Details
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
      doc.text('BILLED TO (CUSTOMER DETAILS)', 48, detailsTop + 10);

      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold');
      doc.text(sale.customerSnapshot.name || 'Walk-in Customer', 48, detailsTop + 26);

      doc.font('Helvetica').fillColor('#475569');
      doc.text(`Phone: ${sale.customerSnapshot.phone || '-'}`, 48, detailsTop + 39);
      doc.text(`Email: ${sale.customerSnapshot.email || '-'}`, 48, detailsTop + 51);
      doc.text(`Address: ${sale.customerSnapshot.address || '-'}`, 48, detailsTop + 63, { width: 220, height: 20 });
      if (sale.customerSnapshot.vehicleNumber) {
        doc.text(`Vehicle: ${sale.customerSnapshot.vehicleNumber} ${sale.customerSnapshot.vehicleModel ? `(${sale.customerSnapshot.vehicleModel})` : ''}`, 48, detailsTop + 75);
      }

      // Right: Invoice Details
      const metaLeft = 320;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
      doc.text('INVOICE INFORMATION', metaLeft, detailsTop + 10);

      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text('Invoice No:', metaLeft, detailsTop + 26);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(sale.invoiceNo, metaLeft + 80, detailsTop + 26);

      doc.font('Helvetica').fillColor('#475569').text('Date & Time:', metaLeft, detailsTop + 40);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(formatIST(sale.createdAt), metaLeft + 80, detailsTop + 40);

      doc.font('Helvetica').fillColor('#475569').text('Payment Mode:', metaLeft, detailsTop + 54);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(`${sale.paymentMode} (${sale.paymentStatus})`, metaLeft + 80, detailsTop + 54);

      doc.font('Helvetica').fillColor('#475569').text('Billed By:', metaLeft, detailsTop + 68);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(sale.soldBy?.name || 'Counter Staff', metaLeft + 80, detailsTop + 68);

      // --- Items Table Header ---
      let y = 222;
      doc.rect(36, y, 523, 22).fill('#131418');
      doc.rect(36, y, 523, 22).strokeColor('#2A2D34').stroke();

      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text('#', 44, y + 6, { width: 20 });
      doc.text('Item Description', 70, y + 6, { width: 195 });
      doc.text('Size / Model', 270, y + 6, { width: 100 });
      doc.text('Qty', 375, y + 6, { width: 30, align: 'center' });
      doc.text('Rate (₹)', 415, y + 6, { width: 60, align: 'right' });
      doc.text('Total (₹)', 480, y + 6, { width: 70, align: 'right' });

      y += 22;

      // Table Rows
      doc.font('Helvetica').fontSize(8.5);
      sale.items.forEach((item, index) => {
        const rowHeight = 24;
        if (index % 2 === 1) {
          doc.rect(36, y, 523, rowHeight).fill('#F8FAFC');
        }
        doc.rect(36, y, 523, rowHeight).strokeColor('#E2E8F0').stroke();

        doc.fillColor(textColor);
        doc.text(String(index + 1), 44, y + 7, { width: 20 });

        doc.font('Helvetica-Bold');
        doc.text(item.name, 70, y + 7, { width: 195 });
        doc.font('Helvetica');

        doc.text(item.size || '-', 270, y + 7, { width: 100 });
        doc.text(String(item.qty), 375, y + 7, { width: 30, align: 'center' });
        doc.text(formatRupees(item.unitPricePaise, false), 415, y + 7, { width: 60, align: 'right' });
        doc.text(formatRupees(item.lineTotalPaise, false), 480, y + 7, { width: 70, align: 'right' });

        y += rowHeight;
      });

      // --- Summary Section ---
      y += 10;
      const summaryLeft = 320;
      const summaryWidth = 239;

      // Draw QR Code on bottom left
      if (qrBuffer) {
        doc.image(qrBuffer, 48, y, { width: 85 });
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
        doc.text('Scan to verify invoice', 44, y + 90, { width: 100, align: 'center' });
      }

      // Rupees in Words Box
      doc.rect(145, y, 165, 85).strokeColor(borderColor).stroke();
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold');
      doc.text('Amount in Words:', 152, y + 8);
      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      doc.text(paiseToWordsINR(sale.totalPaise), 152, y + 22, { width: 150 });

      // Financials Breakdown Table
      doc.rect(summaryLeft, y, summaryWidth, 85).strokeColor(borderColor).stroke();

      const calcRow = (label, valueStr, currentY, isBold = false, isHighlight = false) => {
        if (isHighlight) {
          doc.rect(summaryLeft, currentY - 2, summaryWidth, 20).fill(accentYellow);
          doc.fillColor('#0A0A0C').fontSize(10).font('Helvetica-Bold');
        } else {
          doc.fillColor(isBold ? primaryColor : '#475569')
            .fontSize(isBold ? 9.5 : 8.5)
            .font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        }

        doc.text(label, summaryLeft + 10, currentY);
        doc.text(valueStr, summaryLeft + 120, currentY, { width: 105, align: 'right' });
      };

      calcRow('Subtotal:', formatRupees(sale.subtotalPaise), y + 10);
      if (sale.discountPaise > 0) {
        calcRow('Discount Applied:', `- ${formatRupees(sale.discountPaise)}`, y + 28);
      } else {
        calcRow('Discount:', '₹0.00', y + 28);
      }
      calcRow('Grand Total (INR):', formatRupees(sale.totalPaise), y + 54, true, true);

      // --- Terms & Warranty Section ---
      y += 105;
      doc.rect(36, y, 350, 75).strokeColor(borderColor).stroke();
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold');
      doc.text('TERMS & WARRANTY CONDITIONS:', 44, y + 8);
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
      const terms = settings?.termsAndConditions ||
        '1. Genuine manufacturer warranty applies against defects.\n2. Original receipt must be produced for warranty claims.\n3. Wheel alignment & balancing recommended every 5,000 km.';
      doc.text(terms, 44, y + 22, { width: 335, height: 45 });

      // Authorized Signatory Box
      doc.rect(395, y, 164, 75).strokeColor(borderColor).stroke();
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text(`For ${settings?.shopName || 'HIND TYRES & ACCESSORIES'}`, 402, y + 8, { width: 150, align: 'center' });
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
      doc.text('Authorised Signatory', 402, y + 58, { width: 150, align: 'center' });

      // Footer notice
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica');
      doc.text(
        settings?.invoiceFooter || 'Thank you for your business! Drive safely.',
        36,
        775,
        { width: 523, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePDF,
};
