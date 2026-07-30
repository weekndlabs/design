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

/**
 * Oklab and sRGB, from the CSS Color 4 matrices.
 *
 * Written out rather than pulled from a dependency because the package ships
 * with none, and because a wrong matrix here silently shifts every colour in
 * the system by an amount too small to see and large enough to fail contrast.
 * The round-trip test is what holds these numbers honest.
 */
const LMS_FROM_OKLAB = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.2914855480],
];
const LINEAR_FROM_LMS = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010],
];
const LMS_FROM_LINEAR = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const OKLAB_FROM_LMS = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
];

const apply = (m, v) => m.map((row) => row.reduce((sum, k, i) => sum + k * v[i], 0));
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const clamp255 = (v) => Math.min(255, Math.max(0, Math.round(v * 255)));

/** @param {string} value e.g. "oklch(0.784 0.13 84.5)" @returns {[number,number,number]} */
export function oklchToSrgb(value) {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(String(value).trim());
  if (!m) throw new Error(`not an oklch colour: ${value}`);
  const [l, c, hDeg] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = (hDeg * Math.PI) / 180;
  const lab = [l, c * Math.cos(h), c * Math.sin(h)];
  const lms = apply(LMS_FROM_OKLAB, lab).map((v) => v ** 3);
  return apply(LINEAR_FROM_LMS, lms).map((v) => clamp255(toGamma(v)));
}

/** @param {string} hex @returns {string} e.g. "oklch(0.784 0.13 84.5)" */
export function srgbToOklch(hex) {
  const lms = apply(
    LMS_FROM_LINEAR,
    hexToRgb(hex).map((v) => toLinear(v / 255))
  ).map((v) => Math.cbrt(v));
  const [l, a, b] = apply(OKLAB_FROM_LMS, lms);
  const c = Math.hypot(a, b);
  // Hue is meaningless at zero chroma, and letting it come out as -0 or 180
  // makes two identical greys look like different tokens in a diff.
  const h = c < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return `oklch(${+l.toFixed(4)} ${+c.toFixed(4)} ${+h.toFixed(2)})`;
}

/** Accepts either notation, so the gate keeps working during the migration. */
export function parseColor(value) {
  return String(value).startsWith('oklch(') ? oklchToSrgb(value) : hexToRgb(value);
}

/** @param {string} a @param {string} b @returns {number} */
export function contrastRatio(a, b) {
  const la = relativeLuminance(parseColor(a));
  const lb = relativeLuminance(parseColor(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
