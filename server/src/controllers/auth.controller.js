const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const ShopSettings = require('../models/ShopSettings');
const config = require('../config/env');
const { OAuth2Client } = require('google-auth-library');
const { sendPasswordResetOtpEmail } = require('../utils/mailer');
const auditService = require('../services/audit.service');

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});

/**
 * Login Controller
 */
async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'This account has been disabled. Please contact the administrator.',
      });
    }

    // Only accounts with role ADMIN or COUNTER can log in
    if (user.role !== 'ADMIN' && user.role !== 'COUNTER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only registered staff and administrators can access the system.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await auditService.log({
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      req,
      user,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isPrimaryAdmin: user.isPrimaryAdmin || user.email === 'hindtyre01@gmail.com',
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res, next) {
  try {
    const settings = await ShopSettings.findOne();
    res.json({
      success: true,
      data: {
        user: req.user,
        settings,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Forgot Password - Send 6-digit OTP
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't leak user existence in response, return success message
      return res.json({
        success: true,
        message: 'If the email is registered, a 6-digit OTP has been sent.',
      });
    }

    // Check 60-second cooldown
    const existingOtp = await EmailOtp.findOne({ email: normalizedEmail });
    if (existingOtp && existingOtp.lastSentAt) {
      const secondsSince = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (secondsSince < 60) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${Math.ceil(60 - secondsSince)} seconds before requesting a new OTP.`,
        });
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        otp,
        expiresAt,
        lastSentAt: new Date(),
        verified: false,
      },
      { upsert: true, new: true }
    );

    await sendPasswordResetOtpEmail({ email: normalizedEmail, otp });

    res.json({
      success: true,
      message: 'A 6-digit verification code has been dispatched to your email address.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify OTP
 */
async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const otpDoc = await EmailOtp.findOne({ email: normalizedEmail });
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        error: 'No OTP request found for this email or it has expired.',
      });
    }

    if (new Date() > new Date(otpDoc.expiresAt)) {
      await EmailOtp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
      });
    }

    if (otpDoc.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP code. Please enter the correct 6-digit code.',
      });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    res.json({
      success: true,
      message: 'OTP verified successfully. You may now reset your password.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset Password
 */
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const otpDoc = await EmailOtp.findOne({ email: normalizedEmail, otp });
    if (!otpDoc || !otpDoc.verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP not verified or has expired. Please verify again.',
      });
    }

    if (new Date() > new Date(otpDoc.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { passwordHash }
    );

    // Invalidate OTP after use
    await EmailOtp.deleteOne({ _id: otpDoc._id });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Google OAuth Login
 */
async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Google credential is required' });
    }

    const clientId =
      config.GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      '523066431360-mfe1183b1ftu79t5etfhcojot59cck28.apps.googleusercontent.com';
    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Google Client ID is not configured on the server. Please add GOOGLE_CLIENT_ID in server/.env.',
      });
    }

    // Verify Google ID token
    let payload;
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({ success: false, error: 'Invalid or expired Google token.' });
    }

    const { email, name } = payload;
    const normalizedEmail = email.toLowerCase();

    // Designate admin emails (hindtyre01@gmail.com is the primary owner)
    const isAdminEmail =
      normalizedEmail === 'hindtyre01@gmail.com' ||
      normalizedEmail === 'prolemda@gmail.com' ||
      normalizedEmail === 'test_admin@hindtyres.com';

    // Find user
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'This account has been disabled. Please contact the administrator.',
        });
      }

      // Automatically ensure admin role for prolemda@gmail.com
      if (isAdminEmail && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
        await user.save();
      }

      // Only ADMIN or COUNTER accounts can log in
      if (user.role !== 'ADMIN' && user.role !== 'COUNTER') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only registered staff and administrators can access the system.',
        });
      }
    } else {
      // Unregistered Google user: only master owner prolemda@gmail.com is allowed to bootstrap
      if (!isAdminEmail) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. This Gmail account has not been added by the Administrator. Please contact your shop admin.',
        });
      }

      const randomPassword = Math.random().toString(36).slice(-10) + Date.now();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name: name || (normalizedEmail === 'hindtyre01@gmail.com' ? 'ISTIYAK' : 'Administrator'),
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
        isPrimaryAdmin: normalizedEmail === 'hindtyre01@gmail.com',
        isActive: true,
      });
      await user.save();

      await auditService.log({
        action: 'GOOGLE_REGISTER',
        entity: 'User',
        entityId: user._id,
        req,
        user,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await auditService.log({
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      req,
      user,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isPrimaryAdmin: user.isPrimaryAdmin || user.email === 'hindtyre01@gmail.com',
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public User Registration - Disabled per shop policy
 */
async function register(req, res, next) {
  return res.status(403).json({
    success: false,
    error: 'Public registration is disabled. Staff and Admin accounts must be created inside the Admin Portal.',
  });
}

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

/**
 * Update Profile (Name & Phone only; Email/Gmail is locked and cannot be changed)
 */
async function updateProfile(req, res, next) {
  try {
    const { name, phone } = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // Email/Gmail is locked and never changed
    await user.save();

    await auditService.log({
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: user._id,
      afterSnapshot: { name: user.name, email: user.email, phone: user.phone },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  register,
  getMe,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
};

