/**
 * A11yFix Backend – Express Server Entry Point
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./services/db');
const auditRouter = require('./routes/audit');
const historyRouter = require('./routes/history');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Connect Database ──────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/audit', auditRouter);
app.use('/api/history', historyRouter);
app.use('/api/settings', settingsRouter);

// ── Global error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  });
});

// ── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const geminiConfigured =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  console.log(`\n  ✦ A11yFix API running at http://localhost:${PORT}`);
  console.log(`  ✦ Gemini API key: ${geminiConfigured ? '✓ configured' : '✗ missing or placeholder'}`);
  console.log(`  ✦ Gemini model:   ${process.env.GEMINI_MODEL || 'gemini-3.8-flash'}\n`);
});
