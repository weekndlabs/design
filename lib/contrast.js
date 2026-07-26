/**
 * WCAG 2.1 relative luminance and contrast ratio.
 *
 * Kept dependency-free and pure so the token tests can assert real numbers
 * rather than trusting a comment. Every ratio printed on the docs site is
 * computed by this file, not typed by hand.
 */

/** @param {string} hex @returns {[number, number, number]} */
export function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`not a 6-digit hex: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** @param {string} hex @returns {string} e.g. "245 184 65" */
export function toTriplet(hex) {
  return hexToRgb(hex).join(' ');
}

/** @param {[number, number, number]} rgb @returns {number} */
export function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** @param {string} a @param {string} b @returns {number} */
export function contrastRatio(a, b) {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
