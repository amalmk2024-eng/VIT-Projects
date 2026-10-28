/**
 * Settings Route – GET/PUT /api/settings
 *
 * Allows the frontend to view and update the Gemini API key
 * and cache/model status at runtime. The key is masked on GET
 * for security. PUT updates process.env and resets the client.
 */

const express = require('express');
const router = express.Router();
const { getCacheStats, resetClient } = require('../services/geminiService');

// GET /api/settings – return current configuration (masked key)
router.get('/', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const masked = apiKey.length > 8
    ? apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4)
    : apiKey ? '••••••••' : '';
  const isConfigured = Boolean(apiKey && apiKey.trim() && apiKey !== 'your_gemini_api_key_here');

  res.json({
    success: true,
    settings: {
      geminiApiKey: masked,
      geminiApiKeyConfigured: isConfigured,
      geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      rpmLimit: Number.parseInt(process.env.GEMINI_RPM_LIMIT || '15', 10),
      imageLimitPerAudit: Number.parseInt(process.env.GEMINI_IMAGE_LIMIT_PER_AUDIT || '5', 10),
      cache: getCacheStats(),
    },
  });
});

// PUT /api/settings – update Gemini API key at runtime
router.put('/', (req, res) => {
  const { geminiApiKey } = req.body;

  if (geminiApiKey !== undefined) {
    if (typeof geminiApiKey !== 'string' || geminiApiKey.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'API key must be at least 10 characters.',
      });
    }
    process.env.GEMINI_API_KEY = geminiApiKey.trim();
    resetClient();
  }

  res.json({
    success: true,
    message: 'Settings updated successfully.',
  });
});

module.exports = router;
