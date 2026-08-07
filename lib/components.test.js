import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadScale, loadThemes, ROLES, TERMINAL } from './tokens.js';

const css = readFileSync(new URL('../dist/components.css', import.meta.url), 'utf8');
const tokensCss = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const marketing = readFileSync(new URL('../dist/marketing.css', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../dist/catalog.css', import.meta.url), 'utf8');

const sheets = { 'components.css': css, 'marketing.css': marketing, 'catalog.css': catalog };

/** Comments carry prose that looks like selectors and values. Strip them once. */
const bare = (sheet) => sheet.replace(/\/\*[\s\S]*?\*\//g, '');
/** Rule bodies, keyed by each selector in the list that introduces them. */
const rules = (sheet) =>
  [...bare(sheet).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
    // Commas separate the list, and a list may span lines. Splitting on the
    // newline instead drops every selector but the last, which is how
    // `.wl-input, .wl-textarea { min-height: 44px }` read as having no target.
    selectors: selectors.split(',').map((x) => x.trim()),
    body,
  }));

/** Every `--wl-*` a sheet reads. */
const referenced = (sheet) => [...sheet.matchAll(/var\((--wl-[a-z0-9-]+)/g)].map((m) => m[1]);
/** Every `--wl-*` a sheet defines itself. */
const defined = (sheet) => [...sheet.matchAll(/^\s*(--wl-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);

test('every variable a component reads is one the package defines', async () => {
  // An unresolved custom property renders as nothing. No error, no warning, and
  // in a colour position the element simply disappears. This is the only way to
  // catch a typo in a token name.
  const scale = (await loadScale()).map(({ path }) => `--wl-${path.join('-')}`);
  const available = new Set([
    ...scale,
    ...ROLES.map((r) => `--wl-${r}`),
    ...TERMINAL.map((r) => `--wl-terminal-${r}`),
  ]);

  for (const [name, sheet] of Object.entries(sheets)) {
    const own = new Set(defined(sheet));
    for (const variable of referenced(sheet)) {
      assert.ok(
        available.has(variable) || own.has(variable),
        `${name} reads ${variable}, which no token defines`
      );
    }
  }
});

test('no component hardcodes a colour', () => {
  // The contrast gate can only measure what the token layer holds. A hex here
  // is a colour nothing checks, in the layer most likely to be copied.
  for (const [name, sheet] of Object.entries(sheets)) {
    // A token declaration is where a value is allowed to be a value. What must
    // not hold a colour is a rule: that is the one the token layer cannot see.
    const declarations = bare(sheet)
      .split('\n')
      .filter((line) => !/^\s*--wl-[a-z0-9-]+\s*:/.test(line))
      .join('\n');

    assert.doesNotMatch(declarations, /#[0-9a-fA-F]{3,8}\b/, `${name} contains a hex colour`);
    assert.doesNotMatch(declarations, /\brgba?\(/, `${name} contains an rgb colour`);
    // oklch is allowed only where it derives from a token, never as a literal
    // triple. `oklch(from var(--wl-ring) ...)` passes; `oklch(0.62 0.2 250)`
    // does not, and neither does plain white outside a token.
    for (const [, value] of declarations.matchAll(/oklch\(([^)]*)\)/g)) {
      const derived = value.includes('from ') || value.includes('var(');
      assert.ok(derived, `${name} has a literal colour outside a token: oklch(${value})`);
    }
  }
});

test('every interactive control clears a 44px tap target', () => {
  // Apple's floor, and the reason a dense toolbar is still usable with a thumb.
  // Every block whose selector list names the control, not just the first: the
  // first is a shared reset that carries no size.
  const blocks = rules(css);
  for (const selector of ['.wl-btn', '.wl-icon-btn', '.wl-chip', '.wl-input']) {
    const own = blocks.filter((r) => r.selectors.includes(selector));
    assert.ok(own.length, `${selector} has no rule of its own`);
    assert.ok(
      own.some(({ body }) => /(min-height|height):\s*44px/.test(body)),
      `${selector} has no 44px target`
    );
  }
});

test('focus is visible, and never removed', () => {
  // A keyboard user who cannot see where they are is the failure this layer
  // exists to prevent, and `outline: none` with no replacement is how it
  // usually happens.
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--wl-ring\)/);
  assert.doesNotMatch(css, /outline:\s*(none|0)\s*;/, 'a focus outline is removed somewhere');
});

test('hover is gated behind a device that has one', () => {
  // A touch device fires hover on tap and leaves it stuck on whatever was last
  // touched, so a phone shows a hovered control nobody hovered.
  const hovers = [...css.matchAll(/:hover/g)].length;
  assert.ok(hovers > 0, 'no hover rules at all, so this test is measuring nothing');
  for (const [, body] of css.matchAll(/@media \(hover: hover\)\s*\{([\s\S]*?)\n\}/g)) {
    void body;
  }
  const gated = [...css.matchAll(/@media \(hover: hover\)\s*\{([\s\S]*?)\n\}/g)]
    .map((m) => [...m[1].matchAll(/:hover/g)].length)
    .reduce((a, b) => a + b, 0);
  assert.equal(gated, hovers, `${hovers - gated} hover rules are not behind @media (hover: hover)`);
});

test('motion is honoured, and can be turned off', () => {
  assert.match(css, /transition:[\s\S]*?var\(--wl-duration-fast\)[\s\S]*?var\(--wl-ease-out\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('container queries are last in every sheet', () => {
  // They tie with the rules they are meant to beat on specificity. This shipped
  // as a bug on the docs site nav, where the links never hid at 320px.
  for (const [name, sheet] of Object.entries(sheets)) {
    const at = sheet.indexOf('@container');
    if (at === -1) continue;
    const after = sheet.slice(at).replace(/@container[^{]*\{[\s\S]*?\n\}/g, '').trim();
    assert.equal(after, '', `${name} has rules after its container query, which will beat it`);
  }
});

test('the component layer defines no token of its own', async () => {
  // A value defined here is a value the token layer does not know about, which
  // is how a component ends up carrying a palette nobody can theme.
  for (const [name, sheet] of Object.entries(sheets)) {
    if (name !== 'components.css') continue; // archetypes define theirs on purpose
    assert.deepEqual(defined(sheet), [], `${name} declares its own tokens`);
  }
  void (await loadThemes());
  void tokensCss;
});
