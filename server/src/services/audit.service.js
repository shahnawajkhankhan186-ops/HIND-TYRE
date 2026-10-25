const AuditLog = require('../models/AuditLog');

/**
 * Audit log recording service
 */
class AuditService {
  async log({ action, entity, entityId, beforeSnapshot = null, afterSnapshot = null, req, user, session = null }) {
    try {
      const auditEntry = new AuditLog({
        action,
        entity,
        entityId: entityId ? String(entityId) : '',
        beforeSnapshot,
        afterSnapshot,
        userId: user?._id || req?.user?._id,
        userName: user?.name || req?.user?.name || 'System',
        ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '',
        userAgent: req?.headers?.['user-agent'] || '',
      });

      if (session) {
        await auditEntry.save({ session });
      } else {
        await auditEntry.save();
      }
      return auditEntry;
    } catch (e) {
      console.error('Audit log failed to save:', e.message);
      // Audit failure should not crash main transaction
      return null;
    }
  }
}

module.exports = new AuditService();
