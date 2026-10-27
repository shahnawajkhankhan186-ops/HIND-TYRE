const nodemailer = require('nodemailer');
const config = require('../config/env');
const { formatIST } = require('./ist-date');
const { formatRupees } = require('./currency');

let transporter = null;

function getTransporter(customPass, customUser) {
  const host = config.SMTP.HOST || 'smtp-relay.brevo.com';
  const port = config.SMTP.PORT || 587;
  const user = customUser || config.SMTP.USER || 'c03cd7001@smtp-brevo.com';
  const pass = customPass || config.SMTP.PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: config.SMTP.SECURE || false,
      auth: {
        user,
        pass,
      },
    });
  }

  // Development fallback mock transporter
  return {
    sendMail: async (options) => {
      console.log(`[Mailer Mock] Email dispatched to ${options.to} | Subject: ${options.subject}`);
      return { messageId: `mock-${Date.now()}` };
    },
  };
}

/**
 * Dispatch an email via Brevo Transactional Email REST API v3
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 */
async function sendViaBrevoApi({
  toEmail,
  toName,
  subject,
  html,
  attachments = [],
  senderEmail,
  senderName,
  apiKey,
}) {
  try {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const payload = {
      sender: {
        name: senderName || 'HIND TYRES & ACCESSORIES',
        email: senderEmail,
      },
      to: [
        {
          email: toEmail,
          name: toName || toEmail,
        },
      ],
      subject,
      htmlContent: html,
    };

    if (attachments && attachments.length > 0) {
      payload.attachment = attachments.map((att) => ({
        name: att.filename || att.name,
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
      }));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg =
        errData.message || `Brevo HTTP ${response.status}: ${response.statusText}`;
      console.error(`[Brevo API Error ${response.status}]:`, errorMsg);
      return { success: false, error: errorMsg, status: response.status, provider: 'brevo' };
    }

    const data = await response.json().catch(() => ({}));
    console.log(`[Brevo API] Successfully sent email to ${toEmail} | MessageId: ${data.messageId}`);
    return { success: true, messageId: data.messageId, provider: 'brevo' };
  } catch (err) {
    console.error(`[Brevo API Network Error] Failed to send email to ${toEmail}:`, err.message);
    return { success: false, error: err.message, provider: 'brevo' };
  }
}

/**
 * Send receipt email with in-memory PDF attachment to customer, seller, or admin
 */
async function sendInvoiceEmail({
  recipientEmail,
  recipientName = '',
  sale,
  pdfBuffer,
  recipientType = 'customer',
  sellerInfo = null,
  shopSettings = null,
}) {
  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.trim()) {
    return { success: false, error: 'Recipient email is empty or invalid.' };
  }

  const cleanRecipientEmail = recipientEmail.trim();
  const shopName = shopSettings?.shopName || 'HIND TYRES AND ACCESSORIES';
  const invoiceDateIST = formatIST(sale.createdAt || new Date());
  const grandTotal = formatRupees(sale.totalPaise);
  const brevoApiKey = (shopSettings?.brevoApiKey || config.BREVO?.API_KEY || '').trim();
  const brevoSenderEmail = (
    shopSettings?.brevoSenderEmail ||
    config.BREVO?.SENDER_EMAIL ||
    config.SMTP?.USER ||
    ''
  ).trim();
  const brevoSenderName =
    shopSettings?.brevoSenderName ||
    config.BREVO?.SENDER_NAME ||
    shopName;

  // Personalized greetings & titles
  let greetingTitle = '';
  let greetingSubtitle = '';
  let subjectPrefix = '';

  if (recipientType === 'customer') {
    greetingTitle = `Dear <strong>${sale.customerSnapshot?.name || recipientName || 'Valued Customer'}</strong>,`;
    greetingSubtitle = `Thank you for choosing <strong>${shopName}</strong>! Your official GST Tax Invoice and tyre warranty receipt for invoice <strong>#${sale.invoiceNo}</strong> has been generated and is attached below.`;
    subjectPrefix = `Tax Invoice & Warranty Receipt #${sale.invoiceNo}`;
  } else if (recipientType === 'seller') {
    const sName = sellerInfo?.name || sale.soldBy?.name || 'Seller';
    const sEmail = sellerInfo?.email || sale.soldBy?.email || cleanRecipientEmail;
    greetingTitle = `Hello <strong>${sName}</strong> (Seller Copy),`;
    greetingSubtitle = `A new product sale has been recorded under your login ID (<strong>${sEmail}</strong>). Please find the tax invoice and warranty receipt for invoice <strong>#${sale.invoiceNo}</strong> attached for your records.`;
    subjectPrefix = `[Sale Recorded - #${sale.invoiceNo}] ${sale.customerSnapshot?.name || 'Customer'}`;
  } else {
    greetingTitle = `<strong>Store Administrator Copy</strong>,`;
    greetingSubtitle = `A new sale has been processed at the counter for invoice <strong>#${sale.invoiceNo}</strong>. Here is the transaction record and official invoice PDF.`;
    subjectPrefix = `[Admin Copy - #${sale.invoiceNo}] ${sale.customerSnapshot?.name || 'Customer'}`;
  }

  const itemsSummaryHtml = (sale.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 600; color: #1e293b;">${item.name}</div>
            <div style="font-size: 11px; color: #64748b;">${item.itemType || 'Tyre'} | Size: ${item.size || 'N/A'} | Brand: ${item.brand || '-'}</div>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #334155;">${item.qty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${formatRupees(item.unitPricePaise)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">${formatRupees(item.lineTotalPaise)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${shopName} Invoice #${sale.invoiceNo}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px 0; background-color: #f1f5f9; color: #1e293b; line-height: 1.5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #0A0A0C; padding: 28px 24px; text-align: left; border-bottom: 3px solid #FFC107;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFC107; letter-spacing: 0.5px;">${shopName}</h1>
                        <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Tax Invoice & Tyre Warranty Record</p>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span style="background: rgba(255, 193, 7, 0.15); border: 1px solid #FFC107; color: #FFC107; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; font-family: monospace;">
                          #${sale.invoiceNo}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Greeting & Content -->
              <tr>
                <td style="padding: 24px;">
                  <p style="font-size: 16px; margin: 0 0 12px; color: #0f172a;">${greetingTitle}</p>
                  <p style="font-size: 14px; color: #475569; margin: 0 0 20px; line-height: 1.6;">${greetingSubtitle}</p>

                  <!-- Invoice Meta Card -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px;">
                          <tr>
                            <td style="color: #64748b; width: 35%;">Invoice Number:</td>
                            <td style="font-weight: 700; color: #0f172a;">${sale.invoiceNo}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Date & Time:</td>
                            <td style="font-weight: 600; color: #334155;">${invoiceDateIST}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Customer Name:</td>
                            <td style="font-weight: 600; color: #0f172a;">${sale.customerSnapshot?.name || 'Walk-in'} (${sale.customerSnapshot?.phone || '-'})</td>
                          </tr>
                          ${
                            sale.customerSnapshot?.vehicleNumber
                              ? `<tr>
                            <td style="color: #64748b;">Vehicle:</td>
                            <td style="font-weight: 600; color: #334155;">${sale.customerSnapshot.vehicleNumber} ${sale.customerSnapshot.vehicleModel ? `(${sale.customerSnapshot.vehicleModel})` : ''}</td>
                          </tr>`
                              : ''
                          }
                          <tr>
                            <td style="color: #64748b;">Billed / Sold By:</td>
                            <td style="font-weight: 600; color: #2563eb;">${sale.soldBy?.name || sellerInfo?.name || 'Store Staff'} ${sale.soldBy?.email ? `&lt;${sale.soldBy.email}&gt;` : ''}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Payment Status:</td>
                            <td>
                              <span style="background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">
                                ${sale.paymentMode} - ${sale.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Items Table -->
                  <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Purchased Items & Warranty</p>
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; font-size: 13px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background: #0f172a; color: #ffffff; text-align: left;">
                        <th style="padding: 10px 12px; font-weight: 600;">Product</th>
                        <th style="padding: 10px 12px; text-align: center; font-weight: 600;">Qty</th>
                        <th style="padding: 10px 12px; text-align: right; font-weight: 600;">Rate</th>
                        <th style="padding: 10px 12px; text-align: right; font-weight: 600;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsSummaryHtml}
                    </tbody>
                  </table>

                  <!-- Totals Summary Card -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                    <tr>
                      <td width="50%"></td>
                      <td width="50%">
                        <table width="100%" cellspacing="0" cellpadding="4" style="font-size: 13px;">
                          <tr>
                            <td style="color: #64748b; text-align: right;">Subtotal:</td>
                            <td style="text-align: right; font-weight: 600; color: #334155;">${formatRupees(sale.subtotalPaise)}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; text-align: right;">GST:</td>
                            <td style="text-align: right; font-weight: 600; color: #334155;">${formatRupees(sale.gstPaise)}</td>
                          </tr>
                          ${
                            sale.discountPaise > 0
                              ? `<tr>
                            <td style="color: #16a34a; text-align: right;">Discount:</td>
                            <td style="text-align: right; font-weight: 600; color: #16a34a;">-${formatRupees(sale.discountPaise)}</td>
                          </tr>`
                              : ''
                          }
                          <tr>
                            <td style="padding-top: 8px; font-size: 15px; font-weight: 700; color: #0f172a; text-align: right;">Grand Total:</td>
                            <td style="padding-top: 8px; text-align: right;">
                              <span style="background: #FFC107; color: #0A0A0C; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 16px;">
                                ${grandTotal}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Attachment Notice -->
                  <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af;">
                      📎 <strong>Official PDF Attached:</strong> An official GST Tax Invoice with QR verification code is attached to this email. Please save it for warranty claims or business accounting.
                    </p>
                  </div>

                  <!-- Footer Notes -->
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
                    <p style="margin: 0 0 4px;"><strong>${shopName}</strong> | GSTIN: ${shopSettings?.gstin || '09AAACH7409R1ZZ'}</p>
                    <p style="margin: 0 0 4px;">📍 ${shopSettings?.address || 'GT Road Bypass, Transport Nagar, Kanpur, UP'}</p>
                    <p style="margin: 0;">📞 Helpline: ${shopSettings?.phone || '+91 98765 43210'} | ✉️ ${shopSettings?.email || 'contact@hindtyres.com'}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const subject = `${subjectPrefix} - ${shopName} (${grandTotal})`;
  const attachments = [
    {
      filename: `Invoice_${sale.invoiceNo}.pdf`,
      name: `Invoice_${sale.invoiceNo}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ];

  // 1. Try Brevo REST API if a REST key (xkeysib-...) is provided
  const isSmtpKey = brevoApiKey.startsWith('xsmtpsib-');
  if (brevoApiKey && !isSmtpKey) {
    if (!brevoSenderEmail) {
      const err = 'Brevo sender email is not configured in settings or .env';
      console.error(`[Brevo Config Error] ${err}`);
      return { success: false, error: err, provider: 'brevo' };
    }

    const brevoResult = await sendViaBrevoApi({
      toEmail: cleanRecipientEmail,
      toName: recipientName || sale.customerSnapshot?.name,
      subject,
      html,
      attachments,
      senderEmail: brevoSenderEmail,
      senderName: brevoSenderName,
      apiKey: brevoApiKey,
    });

    return brevoResult;
  }

  // 2. Brevo SMTP Relay / Nodemailer SMTP
  const smtpPass = (isSmtpKey ? brevoApiKey : config.SMTP.PASS) || '';
  const smtpUser = config.SMTP.USER || 'c03cd7001@smtp-brevo.com';

  if (smtpUser && smtpPass) {
    try {
      const client = getTransporter(smtpPass, smtpUser);
      const fromEmail = brevoSenderEmail || 'prolemda@gmail.com';
      const mailOptions = {
        from: `"${brevoSenderName}" <${fromEmail}>`,
        to: cleanRecipientEmail,
        subject,
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
      console.log(`[Brevo SMTP] Email dispatched to ${cleanRecipientEmail} | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'brevo-smtp' };
    } catch (error) {
      console.error(`Failed to send invoice email via Brevo SMTP to ${cleanRecipientEmail}:`, error.message);
      return { success: false, error: error.message, provider: 'brevo-smtp' };
    }
  }

  // 3. Fallback to Mock in development
  console.log(
    `[Mailer Mock] Neither BREVO_API_KEY nor SMTP credentials configured. Mock receipt dispatched to ${cleanRecipientEmail} | Subject: ${subject}`
  );
  return { success: true, mock: true, messageId: `mock-${Date.now()}` };
}

/**
 * Send 6-digit OTP for password reset
 */
async function sendPasswordResetOtpEmail({ email, otp, shopSettings = null }) {
  if (!email || !email.trim()) {
    return { success: false, error: 'Email is required' };
  }

  const cleanEmail = email.trim();
  const brevoApiKey = (shopSettings?.brevoApiKey || config.BREVO?.API_KEY || '').trim();
  const brevoSenderEmail = (
    shopSettings?.brevoSenderEmail ||
    config.BREVO?.SENDER_EMAIL ||
    config.SMTP?.USER ||
    ''
  ).trim();
  const brevoSenderName =
    shopSettings?.brevoSenderName ||
    config.BREVO?.SENDER_NAME ||
    'HIND TYRES & ACCESSORIES';

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
  const subject = `Hind Tyres - Password Reset OTP: ${otp}`;

  const isSmtpKey = brevoApiKey.startsWith('xsmtpsib-');
  if (brevoApiKey && !isSmtpKey && brevoSenderEmail) {
    return sendViaBrevoApi({
      toEmail: cleanEmail,
      subject,
      html,
      senderEmail: brevoSenderEmail,
      senderName: brevoSenderName,
      apiKey: brevoApiKey,
    });
  }

  const smtpPass = (isSmtpKey ? brevoApiKey : config.SMTP.PASS) || '';
  const smtpUser = config.SMTP.USER || 'c03cd7001@smtp-brevo.com';

  if (smtpUser && smtpPass) {
    try {
      const client = getTransporter(smtpPass, smtpUser);
      const fromEmail = brevoSenderEmail || 'prolemda@gmail.com';
      await client.sendMail({
        from: `"${brevoSenderName}" <${fromEmail}>`,
        to: cleanEmail,
        subject,
        html,
      });
      return { success: true, provider: 'brevo-smtp' };
    } catch (err) {
      console.error('Failed to send OTP email via Brevo SMTP:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: true, mock: true };
}

module.exports = {
  sendInvoiceEmail,
  sendPasswordResetOtpEmail,
  sendViaBrevoApi,
};
