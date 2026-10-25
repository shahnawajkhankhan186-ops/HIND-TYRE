const nodemailer = require('nodemailer');
const config = require('../config/env');
const { formatIST } = require('./ist-date');
const { formatRupees } = require('./currency');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.SMTP.USER && config.SMTP.PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP.HOST,
      port: config.SMTP.PORT,
      secure: config.SMTP.SECURE,
      auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS,
      },
    });
  } else {
    // Development fallback mock transporter
    transporter = {
      sendMail: async (options) => {
        console.log(`[Mailer Mock] Email dispatched to ${options.to} | Subject: ${options.subject}`);
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  return transporter;
}

/**
 * Send receipt email with in-memory PDF attachment to customer or admin
 */
async function sendInvoiceEmail({ recipientEmail, sale, pdfBuffer, recipientType = 'customer', shopSettings }) {
  try {
    const client = getTransporter();
    const shopName = shopSettings?.shopName || 'HIND TYRES AND ACCESSORIES';
    const invoiceDateIST = formatIST(sale.createdAt);
    const grandTotal = formatRupees(sale.totalPaise);

    const itemsSummaryHtml = sale.items
      .map(
        item =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name} (${item.size || '-'})</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.qty}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatRupees(item.lineTotalPaise)}</td>
          </tr>`
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #38bdf8;">${shopName}</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Tax Invoice & Warranty Receipt</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">
            ${recipientType === 'customer' ? `Dear <strong>${sale.customerSnapshot.name}</strong>,` : '<strong>Admin Copy</strong>,'}
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Thank you for purchasing with <strong>${shopName}</strong>. Please find attached your official GST Tax Invoice and tyre warranty document for invoice <strong>#${sale.invoiceNo}</strong>.
          </p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Invoice No:</strong> ${sale.invoiceNo}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Date & Time:</strong> ${invoiceDateIST}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Payment Mode:</strong> ${sale.paymentMode} (${sale.paymentStatus})</p>
            <p style="margin: 0; font-size: 14px; color: #0f172a;"><strong>Grand Total:</strong> <span style="color: #2563eb; font-weight: bold; font-size: 16px;">${grandTotal}</span></p>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 8px; color: #0f172a;">Purchased Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsSummaryHtml}
            </tbody>
          </table>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Please retain the attached PDF invoice for any future tyre warranty claims. For queries, contact us at ${shopSettings?.phone || '+91 98765 43210'}.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: config.SMTP.FROM,
      to: recipientEmail,
      subject: `Invoice #${sale.invoiceNo} from ${shopName} - ${grandTotal}`,
      html,
      attachments: [
        {
          filename: `Invoice_${sale.invoiceNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await client.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send invoice email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send 6-digit OTP for password reset
 */
async function sendPasswordResetOtpEmail({ email, otp }) {
  try {
    const client = getTransporter();
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Hind Tyres - Password Reset</h2>
        <p style="color: #475569; font-size: 14px;">You requested a password reset for your account. Use the 6-digit OTP below to proceed:</p>
        <div style="background: #f1f5f9; text-align: center; padding: 18px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await client.sendMail({
      from: config.SMTP.FROM,
      to: email,
      subject: `Hind Tyres - Password Reset OTP: ${otp}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendInvoiceEmail,
  sendPasswordResetOtpEmail,
};
