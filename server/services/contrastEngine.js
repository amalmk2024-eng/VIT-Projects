/**
 * WCAG 2.2 Contrast Analysis & Remediation Engine
 *
 * Detects text elements failing WCAG AA contrast thresholds and
 * programmatically adjusts the foreground color in HSL space
 * (shifting lightness) to achieve compliance while preserving hue.
 */

const {
  parseColor,
  rgbToHex,
  relativeLuminance,
  contrastRatio,
  rgbToHsl,
  hslToRgb,
} = require('../utils/colorUtils');

/**
 * Analyze an array of extracted text elements and produce
 * remediation patches for every contrast violation found.
 *
 * @param {Array<Object>} elements – scraped from Puppeteer
 *   Each element: { text, selector, tagName, color, backgroundColor, fontSize, fontWeight }
 * @returns {Array<Object>} violations with original + remediated data
 */
function analyzeAndRemediate(elements) {
  const results = [];

  for (const el of elements) {
    const fg = parseColor(el.color);
    const bg = parseColor(el.backgroundColor);

    if (!fg || !bg) continue;

    const fgLum = relativeLuminance(fg.r, fg.g, fg.b);
    const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
    const ratio = contrastRatio(fgLum, bgLum);

    // WCAG AA thresholds
    const isLargeText =
      el.fontSize >= 24 || (el.fontSize >= 18.66 && el.fontWeight >= 700);
    const threshold = isLargeText ? 3.0 : 4.5;

    if (ratio >= threshold) continue; // already passes

    const remediated = remediateColor(fg, bg, threshold);

    results.push({
      text: (el.text || '').substring(0, 120),
      selector: el.selector,
      tagName: el.tagName,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      isLargeText,
      threshold,
      original: {
        fgHex: rgbToHex(fg.r, fg.g, fg.b),
        bgHex: rgbToHex(bg.r, bg.g, bg.b),
        ratio: Math.round(ratio * 100) / 100,
        status: 'FAIL',
      },
      remediated: {
        fgHex: remediated.hex,
        bgHex: rgbToHex(bg.r, bg.g, bg.b),
        ratio: Math.round(remediated.ratio * 100) / 100,
        status: 'PASS',
      },
    });
  }

  return results;
}

/**
 * Shift the foreground color's lightness in HSL space until
 * the contrast against the background meets `threshold`.
 *
 * Strategy:
 *   – Determine whether to darken or lighten based on bg luminance.
 *   – Step lightness in 0.5% increments in the primary direction.
 *   – If the primary direction can't reach threshold, try the other.
 *
 * @returns {{ hex: string, ratio: number }}
 */
function remediateColor(fg, bg, threshold) {
  const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
  const fgHsl = rgbToHsl(fg.r, fg.g, fg.b);

  // Primary direction: darken text on light backgrounds, lighten on dark
  const primaryStep = bgLum > 0.5 ? -0.5 : 0.5;

  let result = searchLightness(fgHsl, bgLum, threshold, primaryStep);
  if (result) return result;

  // Fallback: try the other direction
  result = searchLightness(fgHsl, bgLum, threshold, -primaryStep);
  if (result) return result;

  // Last resort: return pure black or white
  const blackRatio = contrastRatio(0, bgLum);
  const whiteRatio = contrastRatio(1, bgLum);
  if (blackRatio >= threshold) {
    return { hex: '#000000', ratio: Math.round(blackRatio * 100) / 100 };
  }
  return { hex: '#ffffff', ratio: Math.round(whiteRatio * 100) / 100 };
}

/** Walk lightness in one direction looking for a passing ratio. */
function searchLightness(hsl, bgLum, threshold, step) {
  for (let i = 1; i <= 200; i++) {
    const testL = hsl.l + step * i;
    if (testL < 0 || testL > 100) break;

    const testRgb = hslToRgb(hsl.h, hsl.s, testL);
    const testLum = relativeLuminance(testRgb.r, testRgb.g, testRgb.b);
    const testRatio = contrastRatio(testLum, bgLum);

    if (testRatio >= threshold) {
      return {
        hex: rgbToHex(testRgb.r, testRgb.g, testRgb.b),
        ratio: testRatio,
      };
    }
  }
  return null;
}

module.exports = { analyzeAndRemediate };
