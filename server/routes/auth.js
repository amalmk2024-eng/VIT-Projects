/**
 * Authentication Routes – /api/auth
 *
 * Implements developer registration, login with JWT tokens,
 * and user profile management according to Section 7 of the report.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById } = require('../services/db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Register ──────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, geminiKey } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid name (at least 2 characters).',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.',
    });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const user = await createUser({
      name,
      email,
      password,
      geminiKey: geminiKey || '',
    });

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    const token = generateToken(safeUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Registration failed. Please try again.',
    });
  }
});

// ── Login ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both email and password.',
    });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    const token = generateToken(safeUser);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
});

// ── Current User Profile ──────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
