import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from './contrast.js';
import { loadThemes, THEMES, ROLES } from './tokens.js';

const themes = await loadThemes();

const TEXT_ON_SURFACE = {
  ink: 7.0,
  'ink-soft': 4.5,
  accent: 4.5,
  'accent-strong': 4.5,
  positive: 4.5,
  negative: 4.5,
};
const TEXT_ON_INSET = { 'inset-ink': 4.5, 'inset-ink-dim': 4.5 };

test('every theme defines every role', () => {
  for (const theme of THEMES) {
    for (const role of ROLES) {
      assert.ok(themes[theme]?.[role], `${theme} is missing ${role}`);
    }
  }
});

test('no theme carries a role the system does not define', () => {
  for (const theme of THEMES) {
    for (const role of Object.keys(themes[theme])) {
      assert.ok(ROLES.includes(role), `${theme} defines an unknown role: ${role}`);
    }
  }
});

test('every resolved value is an oklch colour', () => {
  for (const theme of THEMES) {
    for (const [role, value] of Object.entries(themes[theme])) {
      assert.match(value, /^oklch\(\d/, `${theme}.${role} = ${value}`);
    }
  }
});

test('text roles clear WCAG on their own surface', () => {
  for (const theme of THEMES) {
    for (const [role, min] of Object.entries(TEXT_ON_SURFACE)) {
      const ratio = contrastRatio(themes[theme][role], themes[theme].surface);
      assert.ok(ratio >= min, `${theme}.${role} = ${ratio.toFixed(2)}:1, need ${min}`);
    }
  }
});

test('inset text clears WCAG on the inset surface', () => {
  for (const theme of THEMES) {
    for (const [role, min] of Object.entries(TEXT_ON_INSET)) {
      const ratio = contrastRatio(themes[theme][role], themes[theme].inset);
      assert.ok(ratio >= min, `${theme}.${role} = ${ratio.toFixed(2)}:1, need ${min}`);
    }
  }
});

test('borders are excluded from the text thresholds', () => {
  // rule-strong on receipt is #A9ABA3 at roughly 2:1. That is correct for a
  // hairline and would be wrong for text, so it must not be asserted above.
  for (const border of ['rule', 'rule-soft', 'rule-strong']) {
    assert.ok(!(border in TEXT_ON_SURFACE), `${border} must not carry a text threshold`);
  }
});

test('panel and sunk surfaces stay distinguishable from the page', () => {
  // A banded background that measures identical to the page is a token with no
  // effect. 1.03:1 is roughly the smallest step that survives a cheap display.
  for (const theme of THEMES) {
    for (const role of ['surface-panel', 'surface-sunk']) {
      const ratio = contrastRatio(themes[theme][role], themes[theme].surface);
      assert.ok(ratio >= 1.03, `${theme}.${role} = ${ratio.toFixed(3)}:1 against surface`);
    }
  }
});

test('ink stays legible on panel and sunk surfaces, not only on the page', () => {
  for (const theme of THEMES) {
    for (const surface of ['surface-panel', 'surface-sunk']) {
      const ratio = contrastRatio(themes[theme].ink, themes[theme][surface]);
      assert.ok(ratio >= 7.0, `${theme}.ink on ${surface} = ${ratio.toFixed(2)}:1, need 7`);
    }
  }
});
