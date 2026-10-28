/**
 * Gemini AI Service – Alt-Text Generation, Label Generation, Link Rewriting
 *
 * Features:
 *   - Configurable lightweight model (default: gemini-3.8-flash)
 *   - Exponential backoff with automatic retry on 429/5xx errors
 *   - In-memory LRU response cache keyed by content hash
 *   - Token-bucket rate limiter to stay within free-tier RPM limits
 */

const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');

// ── Configuration ────────────────────────────────────────────────────
const configuredModel = String(process.env.GEMINI_MODEL || '').trim();
const GEMINI_MODEL =
  !configuredModel || configuredModel === 'gemini-2.0-flash'
    ? 'gemini-3.8-flash'
    : configuredModel;
const configuredImageLimit = Number.parseInt(
  process.env.GEMINI_IMAGE_LIMIT_PER_AUDIT || '5',
  10
);
const GEMINI_IMAGE_LIMIT_PER_AUDIT = Number.isInteger(configuredImageLimit)
  ? Math.max(0, configuredImageLimit)
  : 5;

// Rate-limiter: max requests per minute (free-tier safe default)
const RPM_LIMIT = Number.parseInt(process.env.GEMINI_RPM_LIMIT || '15', 10);

let ai = null;
let quotaBlockedUntil = 0;
let quotaBlockedMessage = '';

// ── In-Memory LRU Cache ──────────────────────────────────────────────
class LRUCache {
  constructor(maxSize = 256) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest entry
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  get size() {
    return this.cache.size;
  }
}

const responseCache = new LRUCache(512);

function cacheKey(prefix, content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 24);
  return `${prefix}:${hash}`;
}

// ── Token-Bucket Rate Limiter ────────────────────────────────────────
class TokenBucketLimiter {
  constructor(maxTokens, refillIntervalMs) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillIntervalMs = refillIntervalMs;
  }

  async acquire() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    // Wait until a token is available
    const waitMs = this.refillIntervalMs / this.maxTokens;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this._refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / this.refillIntervalMs) * this.maxTokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// RPM_LIMIT requests per 60 seconds
const rateLimiter = new TokenBucketLimiter(RPM_LIMIT, 60_000);

// ── Client ───────────────────────────────────────────────────────────
function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured. Set it in server/.env');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Re-initialize the Gemini client (used when API key changes at runtime).
 */
function resetClient() {
  ai = null;
  quotaBlockedUntil = 0;
  quotaBlockedMessage = '';
}

// ── Helpers ──────────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanGeneratedText(value) {
  return String(value || '')
    .trim()
    .replace(/^```(?:text|html)?\s*/i, '')
    .replace(/```$/i, '')
    .replace(/^(["'`])([\s\S]*)\1$/, '$2')
    .trim();
}

function getQuotaInfo(error) {
  let payload = error?.error || error;
  if (typeof error?.message === 'string') {
    try {
      payload = JSON.parse(error.message)?.error || payload;
    } catch {}
  }

  const serialized = JSON.stringify(payload || {});
  if (
    payload?.status !== 'RESOURCE_EXHAUSTED' ||
    !/quota|free.?tier|daily/i.test(serialized)
  ) {
    return null;
  }

  const retryInfo = payload.details?.find((detail) =>
    detail['@type']?.endsWith('RetryInfo')
  );
  const retryDelay = retryInfo?.retryDelay?.match(/([\d.]+)s/);
  const retrySeconds = retryDelay ? Math.ceil(Number(retryDelay[1])) : 86400;
  const hours = Math.floor(retrySeconds / 3600);
  const minutes = Math.ceil((retrySeconds % 3600) / 60);
  const wait = hours ? `${hours}h ${minutes}m` : `${minutes}m`;

  return {
    retrySeconds,
    message: `Gemini daily quota is exhausted. Retry in about ${wait}, or review your API project quota and billing.`,
  };
}

function getAuthenticationError(error) {
  let payload = error?.error || error;
  if (typeof error?.message === 'string') {
    try {
      payload = JSON.parse(error.message)?.error || payload;
    } catch {}
  }

  const serialized = JSON.stringify(payload || {});
  if (
    Number(payload?.code) !== 401 &&
    payload?.status !== 'UNAUTHENTICATED' &&
    !/ACCESS_TOKEN_TYPE_UNSUPPORTED|API key not valid/i.test(serialized)
  ) {
    return null;
  }

  return new Error(
    'Gemini API authentication failed. Replace GEMINI_API_KEY in server/.env with a valid Google AI Studio API key, then restart the API server.'
  );
}

function isRetryableGeminiError(error) {
  if (getQuotaInfo(error)) return false;
  const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);
  if (retryableStatuses.has(Number(error?.status || error?.code))) return true;

  const message = error?.message || String(error);
  try {
    const status = JSON.parse(message)?.error;
    if (
      retryableStatuses.has(Number(status?.code)) ||
      ['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'INTERNAL'].includes(status?.status)
    ) {
      return true;
    }
  } catch {}

  return /high demand|temporarily unavailable|\bUNAVAILABLE\b|\bRESOURCE_EXHAUSTED\b/i.test(
    message
  );
}

/**
 * Exponential backoff retry handler.
 * Delays: 2s → 4s → 8s (base * 2^attempt).
 */
async function retryGeminiRequest(request, options = {}) {
  const maxAttempts = Math.max(1, options.maxAttempts || 3);
  const baseDelay = options.baseDelay || 500;
  const delay =
    options.delay ||
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));

  for (let attempt = 0; ; attempt += 1) {
    if (Date.now() < quotaBlockedUntil) throw new Error(quotaBlockedMessage);
    try {
      // Acquire rate-limit token before each attempt
      await rateLimiter.acquire();
      return await request();
    } catch (error) {
      const authenticationError = getAuthenticationError(error);
      if (authenticationError) throw authenticationError;
      const quotaInfo = getQuotaInfo(error);
      if (quotaInfo) {
        quotaBlockedUntil = Date.now() + quotaInfo.retrySeconds * 1000;
        quotaBlockedMessage = quotaInfo.message;
        throw new Error(quotaBlockedMessage);
      }
      if (attempt + 1 >= maxAttempts || !isRetryableGeminiError(error)) throw error;
      const backoffMs = baseDelay * (2 ** attempt); // 2s, 4s, 8s
      console.log(`[Gemini] Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
      await delay(backoffMs);
    }
  }
}

// ── Core Generation ──────────────────────────────────────────────────
async function generateText(prompt) {
  const key = cacheKey('text', prompt);
  const cached = responseCache.get(key);
  if (cached !== undefined) return cached;

  const response = await retryGeminiRequest(() =>
    getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
  );
  const result = cleanGeneratedText(
    response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text
  );

  responseCache.set(key, result);
  return result;
}

async function mapConcurrent(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await callback(items[index], index);
      }
    })
  );
  return results;
}

function injectAttribute(originalHTML, name, value) {
  return originalHTML.replace(
    /^<([a-z][\w:-]*)/i,
    (_match, tagName) => `<${tagName} ${name}="${escapeHtml(value)}"`
  );
}

function attributePatch(name, value) {
  return `${name}="${escapeHtml(value)}"`;
}

function contextLabel(control) {
  const context =
    control.placeholder || control.context || control.name || control.id || '';
  return context
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

function createAltTextFallback(image, error) {
  const context = image.context || image.title || '';
  const altText = context
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 15)
    .join(' ');

  if (!altText) {
    return {
      ...image,
      altText: null,
      remediatedHTML: null,
      status: 'manual-review',
      error: `Write a descriptive alt text manually. ${error}`,
    };
  }

  return {
    ...image,
    altText,
    remediatedHTML: injectAttribute(image.originalHTML, 'alt', altText),
    status: 'fallback',
    error: `Context-based draft; verify it describes the image. ${error}`,
  };
}

async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const mimeType = (response.headers.get('content-type') || 'image/jpeg')
    .split(';')[0]
    .trim();
  const base64 = Buffer.from(await response.arrayBuffer()).toString('base64');
  return { base64, mimeType };
}

/**
 * Generate alt-text for a single image.
 * Results are cached by image URL to avoid duplicate API calls.
 */
async function generateAltText(imageUrl) {
  const key = cacheKey('alt', imageUrl);
  const cached = responseCache.get(key);
  if (cached !== undefined) return cached;

  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
  const response = await retryGeminiRequest(() =>
    getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: 'Write a concise, descriptive alt-text description for this image suitable for screen reader users. Use 15 words or fewer. Return only the alt text.' },
        ],
      }],
    })
  );
  const result = cleanGeneratedText(
    response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text
  );

  responseCache.set(key, result);
  return result;
}

async function generateAltTextsForImages(images) {
  return mapConcurrent(images, 2, async (image, index) => {
    if (index >= GEMINI_IMAGE_LIMIT_PER_AUDIT) {
      return createAltTextFallback(
        image,
        `Per-audit Gemini image limit (${GEMINI_IMAGE_LIMIT_PER_AUDIT}) reached.`
      );
    }

    try {
      const altText = await generateAltText(image.src);
      if (!altText) throw new Error('Gemini returned an empty alt-text response.');
      return {
        ...image,
        altText,
        remediatedHTML: injectAttribute(image.originalHTML, 'alt', altText),
        status: 'fixed',
      };
    } catch (err) {
      return createAltTextFallback(image, err.message);
    }
  });
}

async function generateLabelsForControls(controls) {
  return mapConcurrent(controls, 2, async (control) => {
    try {
      const context =
        control.placeholder ||
        control.context ||
        control.name ||
        control.id ||
        control.type;
      const prompt = `Generate a short, concise aria-label string (max 3 words) for an input field with the placeholder/context: '${context}'`;
      const label = (await generateText(prompt)).split(/\s+/).slice(0, 3).join(' ');
      if (!label) throw new Error('Gemini returned an empty label.');
      return {
        ...control,
        label,
        remediationPatch: attributePatch('aria-label', label),
        remediatedHTML: injectAttribute(control.originalHTML, 'aria-label', label),
        status: 'fixed',
      };
    } catch (err) {
      const label = contextLabel(control);
      if (label) {
        return {
          ...control,
          label,
          remediationPatch: attributePatch('aria-label', label),
          remediatedHTML: injectAttribute(control.originalHTML, 'aria-label', label),
          status: 'fallback',
          error: `Gemini unavailable; generated a best-effort label from field context: ${err.message}`,
        };
      }
      return { ...control, label: null, remediatedHTML: null, status: 'error', error: err.message };
    }
  });
}

async function generateLinkTexts(links) {
  return mapConcurrent(links, 2, async (link) => {
    try {
      const prompt =
        `Rewrite this vague link anchor text ("${link.text}") into a descriptive, context-aware link title based on this surrounding content. Return only the replacement link text.\n` +
        JSON.stringify({ href: link.href, heading: link.heading, surroundingContext: link.context });
      const linkText = await generateText(prompt);
      if (!linkText) throw new Error('Gemini returned empty link text.');
      const closingIndex = link.originalHTML.toLowerCase().lastIndexOf('</a>');
      const openingEnd = link.originalHTML.indexOf('>');
      if (openingEnd < 0 || closingIndex < openingEnd) {
        throw new Error('Could not construct an updated anchor element.');
      }
      return {
        ...link,
        linkText,
        remediatedHTML:
          link.originalHTML.substring(0, openingEnd + 1) +
          escapeHtml(linkText) +
          link.originalHTML.substring(closingIndex),
        status: 'fixed',
      };
    } catch (err) {
      return { ...link, linkText: null, remediatedHTML: null, status: 'error', error: err.message };
    }
  });
}

/**
 * Return current cache statistics for monitoring/settings UI.
 */
function getCacheStats() {
  return {
    entries: responseCache.size,
    maxSize: responseCache.maxSize,
    model: GEMINI_MODEL,
    rpmLimit: RPM_LIMIT,
    imageLimit: GEMINI_IMAGE_LIMIT_PER_AUDIT,
  };
}

module.exports = {
  generateAltText,
  generateAltTextsForImages,
  generateLabelsForControls,
  generateLinkTexts,
  retryGeminiRequest,
  createAltTextFallback,
  getCacheStats,
  resetClient,
};
