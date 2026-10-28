/**
 * Audit History Route – GET /api/history
 *
 * Persisted in MongoDB via AuditReport model with in-memory fallback.
 * Allows filtering by authenticated user or viewing global history.
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getAuditHistory, clearAuditHistory } = require('../services/db');

const MAX_HISTORY = 100;
const auditHistory = [];

function addToHistory(entry) {
  auditHistory.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...entry,
  });
  if (auditHistory.length > MAX_HISTORY) {
    auditHistory.length = MAX_HISTORY;
  }
}

function getHistory() {
  return auditHistory;
}

function clearHistory() {
  auditHistory.length = 0;
}

// GET /api/history – list all past audits (with user context if logged in)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const dbHistory = await getAuditHistory({ userId: req.user?.id || null });
    if (dbHistory && dbHistory.length > 0) {
      return res.json({ success: true, history: dbHistory });
    }
    // Fallback to local array
    res.json({ success: true, history: getHistory() });
  } catch (err) {
    console.error('[History] Fetch error:', err.message);
    res.json({ success: true, history: getHistory() });
  }
});

// DELETE /api/history – clear history
router.delete('/', optionalAuth, async (req, res) => {
  try {
    await clearAuditHistory({ userId: req.user?.id || null });
    clearHistory();
    res.json({ success: true, message: 'Audit history cleared.' });
  } catch (err) {
    clearHistory();
    res.json({ success: true, message: 'Audit history cleared.' });
  }
});

module.exports = router;
module.exports.addToHistory = addToHistory;
module.exports.getHistory = getHistory;
module.exports.clearHistory = clearHistory;
