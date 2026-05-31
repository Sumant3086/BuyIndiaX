/**
 * Input sanitization middleware — single pass, no duplicate processing.
 * Order matters: mongo-sanitize → xss-clean → custom rules.
 */
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Single middleware that does both in one pass (no double-sanitize)
const sanitize = [
  mongoSanitize(),
  xss()
];

module.exports = { sanitize };
