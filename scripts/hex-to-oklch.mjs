/**
 * One-time conversion of the token sources from hex to oklch.
 *
 * Kept as a file rather than a paste into a terminal so the numbers in the diff
 * can be regenerated and compared if anyone doubts them later.
 *
 * Usage: node scripts/hex-to-oklch.mjs tokens/color.primitive.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { srgbToOklch } from '../lib/contrast.js';

const [file] = process.argv.slice(2);
if (!file) throw new Error('usage: node scripts/hex-to-oklch.mjs <token-file.json>');

const text = readFileSync(file, 'utf8');
const out = text.replace(/"#([0-9A-Fa-f]{6})"/g, (_, h) => `"${srgbToOklch(`#${h}`)}"`);
writeFileSync(file, out);
console.log(`converted ${file}`);
