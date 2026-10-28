/**
 * Color Utility Functions for WCAG 2.2 Contrast Calculations
 * Implements: sRGB linearization, relative luminance, contrast ratio,
 * RGB <-> HSL color space conversions, and CSS color parsing.
 */

/**
 * Parse any CSS color string to an { r, g, b } object.
 * Supports: hex (#fff, #ffffff), rgb(), rgba(), and common named colors.
 */
function parseColor(color) {
  if (!color || typeof color !== 'string') return null;
  color = color.trim().toLowerCase();

  // Hex colors
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // rgb() / rgba()
  const rgbMatch = color.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/
  );
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Common named colors (fallback — Puppeteer usually returns rgb())
  const named = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    orange: { r: 255, g: 165, b: 0 },
    purple: { r: 128, g: 0, b: 128 },
    transparent: { r: 255, g: 255, b: 255 }, // treat transparent as white
  };

  return named[color] || null;
}

/** Convert hex string (#abc or #aabbcc) to { r, g, b }. */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length !== 6) return null;
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/** Convert { r, g, b } to a 6-digit hex string with leading #. */
function rgbToHex(r, g, b) {
  const clamp = (v) => Math.round(Math.max(0, Math.min(255, v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Linearize a single sRGB channel value (0-255) to linear-light.
 * WCAG 2.2 § 1.4.3 uses the IEC 61966-2-1 transfer function.
 */
function linearize(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate WCAG 2.2 relative luminance from RGB (0-255).
 * L = 0.2126·R_lin + 0.7152·G_lin + 0.0722·B_lin
 */
function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG contrast ratio between two luminance values.
 * Ratio = (L_lighter + 0.05) / (L_darker + 0.05)
 */
function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Convert RGB (0-255) to HSL { h: 0-360, s: 0-100, l: 0-100 }. */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Convert HSL { h: 0-360, s: 0-100, l: 0-100 } to RGB { r, g, b } (0-255). */
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

module.exports = {
  parseColor,
  hexToRgb,
  rgbToHex,
  linearize,
  relativeLuminance,
  contrastRatio,
  rgbToHsl,
  hslToRgb,
};
