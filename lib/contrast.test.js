import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToRgb,
  contrastRatio,
  toTriplet,
  oklchToSrgb,
  srgbToOklch,
  parseColor,
} from './contrast.js';

test('parses hex into channels', () => {
  assert.deepEqual(hexToRgb('#F5B841'), [245, 184, 65]);
  assert.deepEqual(hexToRgb('12141F'), [18, 20, 31]);
});

test('rejects anything that is not a 6-digit hex', () => {
  for (const bad of ['#FFF', '#GGGGGG', 'rgb(0,0,0)', '', '#1234567']) {
    assert.throws(() => hexToRgb(bad), /not a 6-digit hex/, `accepted ${bad}`);
  }
});

test('emits a Tailwind-compatible triplet', () => {
  assert.equal(toTriplet('#F5B841'), '245 184 65');
});

test('matches known WCAG ratios', () => {
  // Black on white is the definitional maximum.
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF') * 100) / 100, 21);
  // Identical colours are the minimum.
  assert.equal(contrastRatio('#12141F', '#12141F'), 1);
});

test('is symmetric', () => {
  const a = contrastRatio('#F5B841', '#12141F');
  const b = contrastRatio('#12141F', '#F5B841');
  assert.equal(a, b);
});

test('reproduces the ratios this system depends on', () => {
  const round = (n) => Math.round(n * 100) / 100;
  assert.equal(round(contrastRatio('#F5B841', '#12141F')), 10.31);
  assert.equal(round(contrastRatio('#9C6100', '#FAF8F3')), 4.8);
  assert.equal(round(contrastRatio('#FFB000', '#0B0B0C')), 10.74);
});

test('oklch round-trips through sRGB', () => {
  // The amber the system is built on. A round trip must land back on the same
  // hex, or every converted token value is silently a slightly different colour.
  for (const hex of ['#F5B841', '#12141F', '#FAF8F3', '#7A4E00', '#E3E4E0']) {
    const back = oklchToSrgb(srgbToOklch(hex));
    assert.deepEqual(back, hexToRgb(hex), `${hex} did not survive the round trip`);
  }
});

test('oklch parses to the same channels as its hex', () => {
  assert.deepEqual(parseColor('oklch(0 0 0)'), [0, 0, 0]);
  assert.deepEqual(parseColor('oklch(1 0 0)'), [255, 255, 255]);
  assert.deepEqual(parseColor('#F5B841'), [245, 184, 65]);
});

test('contrast is identical whether the input is hex or oklch', () => {
  const hex = contrastRatio('#F5B841', '#12141F');
  const ok = contrastRatio(srgbToOklch('#F5B841'), srgbToOklch('#12141F'));
  assert.equal(Math.round(hex * 100), Math.round(ok * 100));
  assert.equal(Math.round(hex * 100) / 100, 10.31);
});

test('rejects anything that is not an oklch colour', () => {
  for (const bad of ['oklch()', 'oklch(1 0)', 'oklch(a b c)', 'rgb(0,0,0)', '']) {
    assert.throws(() => oklchToSrgb(bad), /not an oklch colour/, `accepted ${bad}`);
  }
});
