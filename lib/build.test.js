import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toTriplet } from './contrast.js';
import { loadThemes, THEMES, ROLES } from './tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const themes = await loadThemes();

test('css emits a block per theme', () => {
  assert.match(css, /\[data-theme='night-dark'\]/);
  assert.match(css, /\[data-theme='night-light'\]/);
  assert.match(css, /\[data-theme='receipt'\]/);
});

test('css emits triplets, never hex', () => {
  assert.doesNotMatch(css, /#[0-9A-Fa-f]{6}/, 'a hex leaked into the CSS output');
  assert.match(css, /--wl-accent:\s*245 184 65;/);
});

test('css carries the shared scale as well as the colours', () => {
  for (const variable of [
    '--wl-space-5', '--wl-radius-lg', '--wl-measure-page',
    '--wl-text-display', '--wl-tracking-eyebrow',
    '--wl-font-night-body', '--wl-font-receipt-mono',
  ]) {
    assert.match(css, new RegExp(`${variable}:`), `${variable} is missing from the CSS`);
  }
});

test('every theme block carries every role, matching the token source', () => {
  for (const theme of THEMES) {
    const block = css.match(new RegExp(`\\[data-theme='${theme}'\\] \\{([^}]*)\\}`))?.[1];
    assert.ok(block, `no block emitted for ${theme}`);
    for (const role of ROLES) {
      const expected = toTriplet(themes[theme][role]);
      assert.match(block, new RegExp(`--wl-${role}:\\s*${expected};`), `${theme}.${role}`);
    }
  }
});

test('the default :root block matches night-dark', () => {
  const root = css.match(/^:root \{([^}]*)\}/m)?.[1];
  assert.match(root, /--wl-surface:\s*18 20 31;/);
});

test('tailwind preset wraps tokens in rgb() with an alpha slot', async () => {
  const { default: preset } = await import('../dist/tailwind.js');
  assert.equal(preset.theme.extend.colors.accent.DEFAULT, 'rgb(var(--wl-accent) / <alpha-value>)');
  for (const role of ROLES) {
    assert.ok(preset.theme.extend.colors[role], `tailwind preset is missing ${role}`);
  }
});

test('ts export carries resolved hex for every theme and role', async () => {
  const mod = await import('../dist/tokens.js');
  assert.deepEqual(mod.THEMES, THEMES);
  assert.deepEqual(mod.ROLES, ROLES);
  for (const theme of THEMES) {
    for (const role of ROLES) {
      assert.equal(mod.themes[theme][role], themes[theme][role], `${theme}.${role}`);
    }
  }
});
