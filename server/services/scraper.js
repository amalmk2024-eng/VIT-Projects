/**
 * Puppeteer DOM Scraper – Anti-Bot Hardened
 *
 * Uses puppeteer-extra with the stealth plugin to bypass Cloudflare,
 * Akamai, and PerimeterX anti-bot detection on commercial sites.
 * Launches a headless Chromium instance, loads the target URL,
 * and runs five independent accessibility evaluators in parallel.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { contrastAuditor } = require('../auditors/contrastAuditor');
const { altTextAuditor } = require('../auditors/altTextAuditor');
const { formLabelAuditor } = require('../auditors/formLabelAuditor');
const { linkTextAuditor } = require('../auditors/linkTextAuditor');
const { headingAuditor } = require('../auditors/headingAuditor');

puppeteer.use(StealthPlugin());

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const VIEWPORT = { width: 1920, height: 1080 };

/**
 * Which auditors to run. Callers may pass an `enabledRules` object
 * to skip specific categories (e.g. { contrast: false }).
 * All rules are enabled by default.
 */
const DEFAULT_RULES = {
  contrast: true,
  altText: true,
  formLabels: true,
  linkText: true,
  headingStructure: true,
};

/**
 * Scrape a public URL for accessibility-relevant data.
 *
 * @param {string} url – fully qualified URL to audit
 * @param {Object} [enabledRules] – which auditor categories to run
 * @returns {Promise<{ pageTitle: string, audits: Object }>}
 */
async function scrapeUrl(url, enabledRules = {}) {
  const rules = { ...DEFAULT_RULES, ...enabledRules };
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ],
      timeout: 45000,
    });

    const page = await browser.newPage();

    await page.setViewport(VIEWPORT);
    await page.setUserAgent(DESKTOP_USER_AGENT);

    // Accept-Language header to appear as a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    });

    // Override navigator.webdriver to false for additional stealth
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });

    // Give managed challenges time to complete before classifying the response.
    await new Promise((r) => setTimeout(r, 2000));

    let { pageTitle, pageText } = await readPageSnapshot(page);

    if (isSecurityChallenge(pageTitle, pageText)) {
      await new Promise((r) => setTimeout(r, 6000));
      ({ pageTitle, pageText } = await readPageSnapshot(page));
    }

    if (isSecurityChallenge(pageTitle, pageText)) {
      // Some providers only resolve their challenge after a fresh navigation.
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise((r) => setTimeout(r, 5000));
      ({ pageTitle, pageText } = await readPageSnapshot(page));
    }

    if (isSecurityChallenge(pageTitle, pageText)) {
      const error = new Error(
        'The target returned an anti-bot or security challenge instead of the requested page.'
      );
      error.code = 'TARGET_BLOCKED';
      throw error;
    }

    // Run only the enabled auditors
    const auditPromises = {
      contrast: rules.contrast
        ? contrastAuditor(page)
        : Promise.resolve({ fixes: [], scanned: 0 }),
      altText: rules.altText
        ? altTextAuditor(page)
        : Promise.resolve({ findings: [], scanned: 0 }),
      formLabels: rules.formLabels
        ? formLabelAuditor(page)
        : Promise.resolve({ findings: [], scanned: 0 }),
      linkText: rules.linkText
        ? linkTextAuditor(page)
        : Promise.resolve({ findings: [], scanned: 0 }),
      headingStructure: rules.headingStructure
        ? headingAuditor(page)
        : Promise.resolve({ findings: [], originalTree: [], correctedTree: [], scanned: 0 }),
    };

    const [contrast, altText, formLabels, linkText, headingStructure] =
      await Promise.all([
        auditPromises.contrast,
        auditPromises.altText,
        auditPromises.formLabels,
        auditPromises.linkText,
        auditPromises.headingStructure,
      ]);

    return {
      pageTitle,
      audits: { contrast, altText, formLabels, linkText, headingStructure },
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function readPageSnapshot(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForFunction(
        () => document.readyState === 'interactive' || document.readyState === 'complete',
        { timeout: 10000 }
      );
      return {
        pageTitle: await page.title(),
        pageText: await page.evaluate(() => document.body?.innerText || ''),
      };
    } catch (error) {
      if (!/Execution context was destroyed|Navigating frame was detached/i.test(error.message) || attempt === 2) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function isSecurityChallenge(pageTitle, pageText) {
  const challengeContent = `${pageTitle}\n${pageText}`;
  return (
    /performing security verification|checking your browser|verify you are human/i.test(
      challengeContent
    ) ||
    (/^just a moment/i.test(pageTitle) && /cloudflare|ray id|security/i.test(pageText))
  );
}

module.exports = { scrapeUrl };
