const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.SMTP?.USER && config.SMTP?.PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP.HOST,
      port: config.SMTP.PORT,
      secure: config.SMTP.SECURE || false,
      auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS,
      },
    });
  } else {
    // Development mock transporter
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
 * Receipt email sending is disabled.
 */
async function sendInvoiceEmail() {
  return { success: false, message: 'Receipt emailing is disabled.' };
}

/**
 * Send 6-digit OTP for password reset
 */
async function sendPasswordResetOtpEmail({ email, otp }) {
  if (!email || !email.trim()) {
    return { success: false, error: 'Email is required' };
  }

  const cleanEmail = email.trim();
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

  try {
    const client = getTransporter();
    await client.sendMail({
      from: config.SMTP?.FROM || '"HIND TYRES & ACCESSORIES" <noreply@hindtyres.com>',
      to: cleanEmail,
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
