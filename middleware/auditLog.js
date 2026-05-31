const AuditLog = require('../models/AuditLog');

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function(data) {
      logAudit(req, action, entity, data);
      originalJson.call(this, data);
    };

    res.send = function(data) {
      logAudit(req, action, entity, data);
      originalSend.call(this, data);
    };

    next();
  };
};

async function logAudit(req, action, entity, responseData) {
  try {
    const log = new AuditLog({
      user: req.user?._id,
      action,
      entity,
      entityId: req.params.id || req.body._id,
      changes: {
        before: req.body.before || null,
        after: responseData
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await log.save();
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = { auditLog };
