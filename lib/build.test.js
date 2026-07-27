import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { toTriplet } from './contrast.js';
import { faces } from '../build/fonts.js';
import { loadScale, loadThemes, THEMES, ROLES } from './tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const fontsCss = readFileSync(new URL('../dist/fonts.css', import.meta.url), 'utf8');
const themes = await loadThemes();

/** Token values carry `.`, `(` and `-`, so they cannot go into a regex raw. */
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    '--wl-weight-display', '--wl-leading-body',
  ]) {
    assert.match(css, new RegExp(`${variable}:`), `${variable} is missing from the CSS`);
  }
});

/**
 * The list above only covers the tokens someone thought to name. This covers
 * the rest, so adding a group to tokens/ and forgetting to emit it fails here
 * rather than showing up as a variable that resolves to nothing in a browser.
 */
test('every unthemed token reaches the CSS', async () => {
  const unthemed = (await loadScale()).map(({ path, value }) => [`--wl-${path.join('-')}`, value]);
  assert.ok(unthemed.length >= 30, `only ${unthemed.length} unthemed tokens found, the loader is wrong`);
  for (const [variable, value] of unthemed) {
    assert.match(css, new RegExp(`${variable}: ${escape(value)};`), `${variable} is missing from the CSS`);
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

test('the default block matches night-dark and carries no specificity', () => {
  const root = css.match(/^:where\(:root\) \{([^}]*)\}/m)?.[1];
  assert.ok(root, 'no :where(:root) default block emitted');
  assert.match(root, /--wl-surface:\s*18 20 31;/);
  // A bare :root here would beat a consumer's own default by import order alone,
  // which is the failure this wrapping exists to prevent.
  assert.doesNotMatch(css, /^:root \{[^}]*--wl-surface:/m, 'the default theme leaked into a bare :root');
});

/**
 * The face list is derived from the tokens, so this checks the derivation
 * landed rather than re-listing the families by hand. A family named in
 * `font.*` with no file shipped is the failure that matters: the page falls
 * back to system-ui and nobody notices until they compare screenshots.
 */
test('every family the tokens name ships a file and a licence', async () => {
  const shipped = await faces();
  assert.equal(shipped.length, 6, 'expected six faces, two stacks of three');

  for (const { family, pkg, weight } of shipped) {
    assert.match(
      fontsCss,
      new RegExp(`font-family: '${family}';\\n  font-style: normal;\\n  font-weight: ${weight};`),
      `${family} ${weight} has no @font-face`
    );
    for (const file of [`${pkg}-${weight}.woff2`, `${pkg}.LICENSE.txt`]) {
      assert.ok(existsSync(new URL(`../dist/fonts/${file}`, import.meta.url)), `dist/fonts/${file} is missing`);
    }
  }
});

test('every shipped licence is the OFL the package claims', () => {
  for (const file of readdirSync(new URL('../dist/fonts/', import.meta.url))) {
    if (!file.endsWith('.LICENSE.txt')) continue;
    const text = readFileSync(new URL(`../dist/fonts/${file}`, import.meta.url), 'utf8');
    assert.match(text, /SIL OPEN FONT LICENSE Version 1\.1/, `${file} is not OFL 1.1`);
    assert.match(text, /^Copyright/, `${file} has no copyright line to carry`);
  }
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
