const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const auditService = require('../services/audit.service');

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().default(''),
  password: z.string().min(6, 'Password is required and must be at least 6 characters'),
  role: z.enum(['ADMIN', 'COUNTER']).default('COUNTER'),
});

async function getUsers(req, res, next) {
  try {
    const users = await User.find({ role: { $in: ['ADMIN', 'COUNTER'] } })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `User with email "${data.email}" already exists.`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password.trim(), salt);

    const user = new User({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: (data.phone || '').trim(),
      passwordHash,
      role: data.role,
      isActive: true,
    });
    await user.save();

    await auditService.log({
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      afterSnapshot: { name: user.name, email: user.email, phone: user.phone, role: user.role },
      req,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot disable your own administrator account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await auditService.log({
      action: user.isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      entity: 'User',
      entityId: user._id,
      afterSnapshot: { isActive: user.isActive },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `User ${user.name} is now ${user.isActive ? 'Active' : 'Disabled'}.`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Permanently delete a user account from MongoDB (Primary Admin Only)
 */
async function deleteUser(req, res, next) {
  try {
    const isPrimary = req.user.isPrimaryAdmin || req.user.email === 'hindtyre01@gmail.com';
    if (!isPrimary) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only the Primary Administrator has permission to permanently delete accounts.',
      });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    // Protection: Primary Admin cannot delete their own account or another primary admin
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own Primary Administrator account.',
      });
    }

    if (userToDelete.isPrimaryAdmin || userToDelete.email === 'hindtyre01@gmail.com') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the Primary Administrator account.',
      });
    }

    await User.findByIdAndDelete(userToDelete._id);

    await auditService.log({
      action: 'DELETE_USER',
      entity: 'User',
      entityId: userToDelete._id,
      beforeSnapshot: {
        name: userToDelete.name,
        email: userToDelete.email,
        phone: userToDelete.phone,
        role: userToDelete.role,
      },
      req,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Account "${userToDelete.name}" (${userToDelete.email}) permanently deleted from database.`,
      data: { _id: userToDelete._id },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
};
