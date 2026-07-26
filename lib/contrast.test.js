import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb, contrastRatio, toTriplet } from './contrast.js';

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
