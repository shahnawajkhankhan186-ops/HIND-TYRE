const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.SMTP?.USER && config.SMTP?.PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP.HOST || 'smtp-relay.brevo.com',
      port: config.SMTP.PORT || 587,
      secure: config.SMTP.SECURE || false,
      auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

/**
 * Send email via Brevo REST API v3 (Uses HTTPS port 443, never blocked by cloud firewalls)
 */
async function sendViaBrevoApi({ to, subject, htmlContent }) {
  const apiKey = config.BREVO?.API_KEY;
  if (!apiKey) return null;

  const senderEmail = config.BREVO?.SENDER_EMAIL || config.SMTP?.USER || 'hindtyre01@gmail.com';
  const senderName = config.BREVO?.SENDER_NAME || 'HIND TYRES & ACCESSORIES';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Brevo API returned status ${res.status}`);
  }

  return { success: true, messageId: data.messageId || 'brevo-api' };
}

/**
 * Send invoice email placeholder (receipt emailing is disabled)
 */
async function sendInvoiceEmail() {
  return { success: false, message: 'Receipt emailing is disabled.' };
}

/**
 * Send 6-digit OTP for password reset
 * Supports:
 * 1. Brevo REST API (via BREVO_API_KEY)
 * 2. Brevo / Gmail SMTP (via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Localhost Development Fallback (logs to console with testable OTP)
 */
async function sendPasswordResetOtpEmail({ email, otp }) {
  if (!email || !email.trim()) {
    return { success: false, error: 'Email address is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const subject = `Hind Tyres - Password Reset OTP: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset OTP - Hind Tyres</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 24px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">
                    HIND TYRES <span style="color: #f59e0b;">& ACCESSORIES</span>
                  </h1>
                  <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
                    Drive Safe • Drive Far
                  </p>
                </td>
              </tr>
              <!-- Body Content -->
              <tr>
                <td style="padding: 32px 30px;">
                  <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                    Password Reset Verification
                  </h2>
                  <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                    We received a request to reset your password. Use the verification code below to complete the reset process:
                  </p>
                  <!-- OTP Box -->
                  <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #f59e0b; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #b45309; display: inline-block;">
                      ${otp}
                    </span>
                    <div style="margin-top: 8px; font-size: 12px; color: #92400e; font-weight: 600;">
                      ⏰ Valid for 10 minutes
                    </div>
                  </div>
                  <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.4;">
                    HIND TYRES AND ACCESSORIES<br/>
                    Cantonment Market Shop No:03 Near Football Ground Bus Stand Ramgarh Cantt, Jharkhand 829122<br/>
                    Phone: +91 79911 89048 | Email: hindtyre01@gmail.com
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 1. Try Brevo REST API first (fastest and most reliable over HTTPS 443)
  if (config.BREVO?.API_KEY) {
    try {
      const result = await sendViaBrevoApi({ to: cleanEmail, subject, htmlContent: html });
      console.log(`[Brevo API] Successfully sent OTP email to: ${cleanEmail}`);
      return result;
    } catch (err) {
      console.error('[Brevo API Error]:', err.message);
      // Fall through to SMTP if configured
    }
  }

  // 2. Try SMTP via Nodemailer (Brevo SMTP or Gmail SMTP)
  const client = getTransporter();
  if (client) {
    try {
      const fromAddress = config.SMTP?.FROM || `"HIND TYRES & ACCESSORIES" <${config.SMTP.USER}>`;
      await client.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject,
        html,
      });
      console.log(`[SMTP Mailer] Successfully sent OTP email to: ${cleanEmail}`);
      return { success: true };
    } catch (err) {
      console.error('[SMTP Mailer Error]:', err.message);
      return { success: false, error: `SMTP Dispatch failed: ${err.message}` };
    }
  }

  // 3. Fallback when neither Brevo API key nor SMTP credentials are provided
  console.warn('\n========================================================');
  console.warn('⚠️ [MAILER NOT CONFIGURED] No BREVO_API_KEY or SMTP credentials found.');
  console.warn(`📧 Intended Recipient: ${cleanEmail}`);
  console.warn(`🔑 6-Digit Password Reset OTP: [ ${otp} ]`);
  console.warn('👉 Configure BREVO_API_KEY in Render Dashboard or server/.env to send real emails.');
  console.warn('========================================================\n');

  if (config.NODE_ENV === 'production') {
    return {
      success: false,
      error: 'Email delivery service is not configured. Please add BREVO_API_KEY in Render environment settings.',
    };
  }

  // In development, return mock success so local developers can test
  return { success: true, mock: true, otp };
}

module.exports = {
  sendInvoiceEmail,
  sendPasswordResetOtpEmail,
};
