const AuditLog = require('../models/AuditLog');

async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 30, action, entity } = req.query;

    const query = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLogs };
