/**
 * Audit Route – POST /api/audit & POST /api/audit/run
 *
 * Accepts a URL and optional rule configuration, runs the Puppeteer
 * scraper and Gemini remediation pipeline, then returns structured
 * results. Stores completed audits in MongoDB (with in-memory fallback).
 */

const express = require('express');
const router = express.Router();
const { scrapeUrl } = require('../services/scraper');
const {
  generateAltTextsForImages,
  generateLabelsForControls,
  generateLinkTexts,
} = require('../services/geminiService');
const { addToHistory } = require('./history');
const { saveAuditReport } = require('../services/db');
const { optionalAuth } = require('../middleware/auth');

function calcGrade(totalErrors) {
  if (totalErrors === 0) return 'A';
  if (totalErrors <= 3) return 'B';
  if (totalErrors <= 8) return 'C';
  if (totalErrors <= 15) return 'D';
  return 'F';
}

async function handleAuditRequest(req, res) {
  const { url, enabledRules } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid URL is required.' });
  }

  let parsedUrl;
  try {
    const candidate = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    parsedUrl = new URL(candidate);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
  } catch {
    return res.status(400).json({ success: false, error: 'The provided URL is not valid.' });
  }

  try {
    console.log(`[Audit] Starting audit for ${parsedUrl.href}`);
    const { audits, pageTitle } = await scrapeUrl(parsedUrl.href, enabledRules);
    const [altTextFixes, formLabelFixes, linkTextFixes] = await Promise.all([
      generateAltTextsForImages(audits.altText.findings),
      generateLabelsForControls(audits.formLabels.findings),
      generateLinkTexts(audits.linkText.findings),
    ]);

    const contrastFixes = audits.contrast.fixes;
    const headingFixes = audits.headingStructure.findings;
    const formLabelViolations = formLabelFixes.map((fix) => ({
      element: fix.element,
      type: fix.type,
      missingContext: fix.missingContext,
      label: fix.label || null,
      remediationPatch: fix.remediationPatch || null,
      remediatedHTML: fix.remediatedHTML || null,
      status: fix.status,
      error: fix.error,
    }));
    const vagueLinkViolations = linkTextFixes.map((fix) => ({
      href: fix.href,
      originalText: fix.originalText,
      contextSnippet: fix.contextSnippet,
      suggestedText: fix.suggestedText || null,
      remediatedHTML: fix.remediatedHTML || null,
      status: fix.status,
      error: fix.error,
    }));

    const totalErrors =
      contrastFixes.length +
      audits.altText.findings.length +
      formLabelViolations.length +
      vagueLinkViolations.length +
      headingFixes.length;

    const totalFixed =
      contrastFixes.length +
      altTextFixes.filter((f) => f.status === 'fixed' || f.status === 'fallback').length +
      formLabelFixes.filter((f) => f.status === 'fixed' || f.status === 'fallback').length +
      linkTextFixes.filter((f) => f.status === 'fixed' || f.status === 'fallback').length +
      headingFixes.length;

    const summary = {
      pageTitle,
      url: parsedUrl.href,
      grade: calcGrade(totalErrors),
      totalErrors,
      totalFixed,
      contrastViolations: contrastFixes.length,
      missingAltTexts: audits.altText.findings.length,
      unlabeledControls: formLabelViolations.length,
      vagueLinks: vagueLinkViolations.length,
      headingViolations: headingFixes.length,
      scannedTextElements: audits.contrast.scanned,
      scannedImages: audits.altText.scanned,
      scannedControls: audits.formLabels.scanned,
      scannedLinks: audits.linkText.scanned,
      scannedHeadings: audits.headingStructure.scanned,
    };

    const headingViolations = headingFixes.map((finding) => ({
      currentTag: finding.currentTag,
      issue: finding.issue,
      remediationPatch: finding.remediationPatch,
      text: finding.text,
      originalHTML: finding.originalHTML,
      remediatedHTML: finding.remediatedHTML,
    }));

    const violations = {
      contrast: contrastFixes,
      altText: altTextFixes,
      formLabels: formLabelViolations,
      headings: headingViolations,
      linkText: vagueLinkViolations,
    };

    const responseData = {
      success: true,
      url: parsedUrl.href,
      violations,
      summary,
      results: {
        contrastFixes,
        altTextFixes,
        formLabelFixes,
        linkTextFixes,
        headingFixes: audits.headingStructure.correctedTree.map((fix, index) => ({
          ...headingFixes[index],
          ...fix,
        })),
        headingTrees: {
          original: audits.headingStructure.originalTree,
          corrected: audits.headingStructure.correctedTree,
        },
      },
    };

    // Save to database (MongoDB with in-memory fallback)
    try {
      await saveAuditReport({
        userId: req.user?.id || null,
        targetUrl: parsedUrl.href,
        pageTitle,
        grade: summary.grade,
        summary,
        violations,
      });
    } catch (saveErr) {
      console.error('[Audit] Failed to persist report:', saveErr.message);
    }

    // Keep memory history synced
    addToHistory({
      url: parsedUrl.href,
      pageTitle,
      grade: summary.grade,
      totalErrors: summary.totalErrors,
      totalFixed: summary.totalFixed,
      timestamp: new Date().toISOString(),
    });

    return res.json(responseData);
  } catch (err) {
    console.error('[Audit] Error:', err);
    if (err.code === 'TARGET_BLOCKED') {
      return res.status(422).json({
        success: false,
        error: 'The target returned an anti-bot or security challenge. Accessibility findings cannot be verified until the page is accessible to the auditor.',
      });
    }
    if (/Execution context was destroyed|Navigating frame was detached/i.test(err.message || '')) {
      return res.status(422).json({
        success: false,
        error: 'The target kept changing pages while loading, which usually indicates an anti-bot or security challenge. Try a public page that loads without a verification screen.',
      });
    }
    if (err.message?.includes('net::ERR_') || err.message?.includes('Navigation timeout')) {
      return res.status(422).json({
        success: false,
        error: 'Could not load the page. The site may be unreachable, blocking scrapers, or taking too long to respond.',
        details: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during the audit.',
      details: err.message,
    });
  }
}

router.post('/', optionalAuth, handleAuditRequest);
router.post('/run', optionalAuth, handleAuditRequest);

module.exports = router;
