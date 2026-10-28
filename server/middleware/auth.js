const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/db');

const JWT_SECRET = process.env.JWT_SECRET || 'a11yfix-jwt-secret-key-2026';

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or token expired.',
      });
    }

    req.user = user.toSafeObject ? user.toSafeObject() : user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    req.user = user ? (user.toSafeObject ? user.toSafeObject() : user) : null;
  } catch {
    req.user = null;
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET,
};
