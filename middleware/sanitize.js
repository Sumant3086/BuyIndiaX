const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const validator = require('validator');

// Enhanced sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize against NoSQL injection
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  
  // Additional validation for common fields
  if (req.body.email) {
    req.body.email = validator.normalizeEmail(req.body.email);
  }
  
  // Trim whitespace from all string fields
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  });
  
  next();
};

// SQL injection prevention (for any raw queries)
const preventSQLInjection = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi;
  
  const checkForSQL = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && sqlPattern.test(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQL(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
    return res.status(400).json({ message: 'Invalid input detected' });
  }

  next();
};

// XSS protection with custom rules
const xssProtection = (req, res, next) => {
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  
  const checkForXSS = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && xssPattern.test(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForXSS(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkForXSS(req.body) || checkForXSS(req.query)) {
    return res.status(400).json({ message: 'Potential XSS attack detected' });
  }

  next();
};

module.exports = {
  sanitizeInput,
  preventSQLInjection,
  xssProtection,
  mongoSanitize: mongoSanitize(),
  xss: xss()
};
