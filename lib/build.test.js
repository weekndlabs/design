import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { faces } from '../build/fonts.js';
import { loadScale, loadThemes, THEMES, ROLES, TERMINAL } from './tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const fontsCss = readFileSync(new URL('../dist/fonts.css', import.meta.url), 'utf8');
const shadcnCss = readFileSync(new URL('../dist/shadcn.css', import.meta.url), 'utf8');
const themes = await loadThemes();

/** Token values carry `.`, `(` and `-`, so they cannot go into a regex raw. */
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('css emits a block per theme', () => {
  assert.match(css, /\[data-theme='light'\]/);
  assert.match(css, /\[data-theme='dark'\]/);
  // The negative lookahead is the part that matters: it fails on a theme nobody
  // declared, which a list of `assert.match` calls cannot do.
  assert.doesNotMatch(css, /\[data-theme='(?!light'|dark')/, 'a theme nobody declared reached the output');
  assert.doesNotMatch(css, /night-|receipt/, 'an old theme name survived into the output');
});

test('every terminal role reaches every output', () => {
  // These are colours that are not themed, so neither branch of the CSS
  // formatter emitted them at first and they shipped as ten dead tokens that
  // resolved to nothing in a browser. Nothing else in the suite noticed.
  for (const role of TERMINAL) {
    assert.match(css, new RegExp(`--wl-terminal-${role}: oklch`), `tokens.css is missing terminal-${role}`);
    // ground is the DEFAULT, so it registers as --color-terminal and `bg-terminal`
    // compiles. Suffixing it would leave that utility resolving to nothing.
    const utility = role === 'ground' ? 'terminal' : `terminal-${role}`;
    assert.match(shadcnCss, new RegExp(`--color-${utility}: var`), `bg-${utility} would compile to nothing`);
  }
});

test('css emits oklch, never hex and never a bare triplet', () => {
  assert.doesNotMatch(css, /#[0-9A-Fa-f]{6}/, 'a hex leaked into the CSS output');
  assert.match(css, /--wl-primary:\s*oklch\([\d.]+ [\d.]+ [\d.]+\);/);
});

test('css carries the shared scale as well as the colours', () => {
  for (const variable of [
    '--wl-space-5', '--wl-radius-full', '--wl-measure-page',
    '--wl-text-hero', '--wl-tracking-label',
    '--wl-font-sans', '--wl-font-mono', '--wl-font-accent',
    '--wl-weight-semibold', '--wl-leading-body',
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
  const unthemed = (await loadScale())
    // Container widths are the one group that must not be here. A CSS variable
    // cannot be read by @container, so emitting one would advertise a query
    // that never matches. The test below asserts their absence.
    .filter(({ path }) => path[0] !== 'container')
    .map(({ path, value }) => [`--wl-${path.join('-')}`, value]);
  assert.ok(unthemed.length >= 30, `only ${unthemed.length} unthemed tokens found, the loader is wrong`);
  for (const [variable, value] of unthemed) {
    assert.match(css, new RegExp(`${variable}: ${escape(value)};`), `${variable} is missing from the CSS`);
  }
});

test('shadcn.css registers every role as a Tailwind colour', () => {
  for (const role of ROLES) {
    if (role === 'radius') continue;
    assert.match(
      shadcnCss,
      new RegExp(`--color-${role}: var\\(--wl-${role}\\);`),
      `${role} is not registered, so bg-${role} would compile to nothing`
    );
  }
});

test('shadcn.css points the dark variant at data-theme, not a class', () => {
  // Component source never writes .dark, it writes dark: utilities. So
  // redefining the variant is shadcn's own mechanism and copied code keeps
  // working, while data-theme stays the only switch.
  assert.match(shadcnCss, /@custom-variant dark \(&:is\(\[data-theme='dark'\] \*\)\);/);
  assert.doesNotMatch(shadcnCss, /&:is\(\.dark \*\)/, 'the class-based variant survived');
});

test('one host is named once, and canonical and sitemap both derive from it', () => {
  // The site answers on design.weekndlabs.com and on weekndlabs.com/design.
  // Exactly one can be the indexable host, and before this the canonical said
  // the subdomain while every inbound and internal link pointed at the proxy
  // path, so Google was told to index a host nothing linked to.
  //
  // The fix is structural: `site` in astro.config.mjs is the only place the
  // origin appears, and Page.astro and src/pages/sitemap.xml.js both read it.
  // Hardcoding it again is what this catches.
  const config = readFileSync(new URL('../docs/astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /site: SITE/, 'astro.config.mjs must set site');
  // The origin carries a path, /design, and a URL join only keeps a base path
  // when the base ends in a slash. Without it every canonical and every sitemap
  // entry silently loses /design and points at pages that do not exist.
  assert.match(config, /const SITE = 'https:\/\/[^']*\/';/, 'site must end in a slash');

  const layout = readFileSync(new URL('../docs/src/layouts/Page.astro', import.meta.url), 'utf8');
  assert.match(layout, /rel="canonical"[^>]*Astro\.site/, 'canonical must read Astro.site');
  assert.match(
    layout,
    /pathname\.replace\(\/\^\\\/\/, ''\)/,
    'the leading slash must be stripped or the join drops the base path'
  );
  assert.doesNotMatch(
    layout,
    /canonical[^>]*'https:\/\//,
    'the canonical host is hardcoded again, so it can drift from the sitemap'
  );

  const sitemap = readFileSync(new URL('../docs/src/pages/sitemap.xml.js', import.meta.url), 'utf8');
  assert.match(sitemap, /new URL\(route, site\)/, 'the sitemap must join relatively onto site');
});

test('the docs host serves a robots.txt of its own', () => {
  // robots.txt applies per host. weekndlabs.com is behind Cloudflare, which
  // injects its AI block list; this host is served by Vercel directly and
  // answered 404, meaning allow-all, so none of that policy applied here.
  const robots = readFileSync(new URL('../docs/public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /^Sitemap: https:\/\/\S+\/sitemap\.xml$/m, 'no Sitemap directive');
  for (const agent of ['GPTBot', 'ClaudeBot']) {
    assert.match(robots, new RegExp(agent), `${agent} is not even mentioned`);
  }
});

test('every docs page centres its column itself', () => {
  // The layout supplies no wrapper. Each page writes its own `main.wrap`, and
  // that class is what centres the column and gives it horizontal padding.
  // Leaving it out ran the components page to both edges, and it looked enough
  // like a Tailwind preflight problem to send the fix in the wrong direction.
  const dir = new URL('../docs/src/pages/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.astro'))) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    assert.match(source, /<main id="main" class="wrap/, `${file} has no main.wrap`);
  }
});

test('shadcn.css maps the whole radius ladder, not just --radius', () => {
  // Tailwind resolves `rounded-md` from `--radius-md`. Setting `--radius` alone
  // compiles, passes a naive check, and silently leaves every corner on
  // Tailwind's defaults, so the theme's radius never renders. Assert each step.
  assert.match(shadcnCss, /--radius: var\(--wl-radius\);/);
  for (const step of ['xs', 'sm', 'md', 'lg', 'xl']) {
    assert.match(
      shadcnCss,
      new RegExp(`--radius-${step}: (calc\\(var\\(--wl-radius\\)|var\\(--wl-radius\\))`),
      `rounded-${step} would fall back to Tailwind's default radius`
    );
  }
  assert.match(shadcnCss, /--radius-full: var\(--wl-radius-full\);/);
});

test('the type scale has ten roles and no stale theme names', async () => {
  const scale = await loadScale();
  const text = scale.filter((t) => t.path[0] === 'text').map((t) => t.path[1]);
  assert.deepEqual(text.sort(), [
    'body', 'display', 'heading', 'hero', 'label',
    'lede', 'meta', 'section', 'subtitle', 'title',
  ]);
  for (const { path } of scale) {
    assert.ok(!path.includes('night'), `${path.join('.')} still says night`);
    assert.ok(!path.includes('receipt'), `${path.join('.')} still says receipt`);
  }
});

test('the weights shadcn leans on are shipped', async () => {
  const weights = Object.fromEntries(
    (await loadScale()).filter((t) => t.path[0] === 'weight').map((t) => [t.path[1], t.value])
  );
  // shadcn uses font-medium and font-semibold constantly. Without 500 and 600
  // every control falls back to 400 and the whole UI loses its weight, with no
  // error anywhere.
  assert.equal(weights.medium, '500');
  assert.equal(weights.semibold, '600');
});

test('the radius ladder is shared, and --radius still tracks the card step', async () => {
  const scale = await loadScale();
  const radius = Object.fromEntries(
    scale.filter((t) => t.path[0] === 'radius').map((t) => [t.path[1], t.value])
  );
  assert.deepEqual(Object.keys(radius).sort(), ['card', 'control', 'full', 'window']);
  // shadcn reads --radius, and Tailwind derives its whole rounded-* ladder from
  // it. If that drifts from radius.card, a .wl-card and a shadcn <Card/> on the
  // same page round differently and it reads as a rendering fault.
  for (const theme of THEMES) {
    assert.equal(themes[theme].radius, radius.card, `${theme}.radius has drifted from radius.card`);
  }
});

test('the corner shape ships, and degrades on its own', async () => {
  // corner-shape is what makes a corner continuous rather than circular. A
  // browser without it ignores the declaration and keeps border-radius, so the
  // token is safe to use unguarded, which is the reason it is a token at all.
  const corner = (await loadScale()).find((t) => t.path.join('.') === 'corner.shape');
  assert.equal(corner.value, 'squircle');
  assert.match(css, /--wl-corner-shape: squircle;/);
});

test('container widths ship as values, never as a --wl variable', async () => {
  // `@container (max-width: var(--wl-container-narrow))` parses, never matches,
  // and reports nothing. So the width is never a --wl-* variable. It reaches a
  // consumer two ways instead: as data in tokens.js, and as a literal in the
  // Tailwind bridge, where the query is resolved at build time.
  assert.doesNotMatch(css, /--wl-container-/, 'a container width leaked into tokens.css');
  assert.match(css, /--wl-measure-page:/, 'measure widths do belong in the CSS, and are gone');

  const widths = Object.fromEntries(
    (await loadScale()).filter((t) => t.path[0] === 'container').map((t) => [t.path[1], t.value])
  );
  const mod = await import('../dist/tokens.js');
  assert.deepEqual(mod.containers, widths, 'tokens.js has drifted from the token source');
  for (const [name, value] of Object.entries(widths)) {
    assert.match(
      shadcnCss,
      new RegExp(`--container-${name}: ${escape(value)};`),
      `@max-${name} would compile to nothing`
    );
    assert.doesNotMatch(
      shadcnCss,
      new RegExp(`--container-${name}: var\\(`),
      `--container-${name} points at a variable, which a container query cannot resolve`
    );
  }
});

test('every theme block carries every role, matching the token source', () => {
  for (const theme of THEMES) {
    const block = css.match(new RegExp(`\\[data-theme='${theme}'\\] \\{([^}]*)\\}`))?.[1];
    assert.ok(block, `no block emitted for ${theme}`);
    for (const role of ROLES) {
      const expected = escape(themes[theme][role]);
      assert.match(block, new RegExp(`--wl-${role}:\\s*${expected};`), `${theme}.${role}`);
    }
  }
});

test('the default block matches dark and carries no specificity', () => {
  const root = css.match(/^:where\(:root\) \{([^}]*)\}/m)?.[1];
  assert.ok(root, 'no :where(:root) default block emitted');
  assert.match(root, new RegExp(`--wl-background:\\s*${escape(themes.dark.background)};`));
  // A bare :root here would beat a consumer's own default by import order alone,
  // which is the failure this wrapping exists to prevent.
  assert.doesNotMatch(css, /^:root \{[^}]*--wl-background:/m, 'the default theme leaked into a bare :root');
});

/**
 * The face list is derived from the tokens, so this checks the derivation
 * landed rather than re-listing the families by hand. A family named in
 * `font.*` with no file shipped is the failure that matters: the page falls
 * back to system-ui and nobody notices until they compare screenshots.
 */
test('fonts.css carries the Inter character variants', () => {
  // cv02/cv03/cv04/cv11 are a decision about Inter, so they belong with the
  // typeface and not in one consumer's stylesheet.
  assert.match(fontsCss, /font-feature-settings: "cv02", "cv03", "cv04", "cv11";/);
});

test('every family the tokens name ships a file and a licence', async () => {
  const shipped = await faces();
  // One sans as a variable file, one mono, one italic serif.
  assert.equal(shipped.length, 3, `expected three faces, got ${shipped.length}`);

  for (const { family, pkg, weight, style, file } of shipped) {
    assert.match(
      fontsCss,
      new RegExp(`font-family: '${family}';\\n  font-style: ${style};\\n  font-weight: ${weight};`),
      `${family} ${weight} ${style} has no @font-face`
    );
    for (const name of [file, `${pkg}.LICENSE.txt`]) {
      assert.ok(existsSync(new URL(`../dist/fonts/${name}`, import.meta.url)), `dist/fonts/${name} is missing`);
    }
  }
});

test('the sans ships as one variable file spanning the whole weight range', async () => {
  // Static weights would mean four files and no optical size axis, which is what
  // lets one family draw a hero and a caption without looking like two.
  const sans = (await faces()).find((f) => f.role === 'sans');
  assert.equal(sans.weight, '100 900', 'the sans is not a variable face any more');
  assert.match(sans.source, /@fontsource-variable/);
  assert.match(fontsCss, /font-optical-sizing: auto;/, 'a reset can turn opsz off, so it is set here');
});

test('dist/fonts holds nothing the tokens do not name', async () => {
  // The build copies and never deletes. Swapping a family leaves the old woff2
  // behind, still committed, still served, and the licence beside it starts
  // covering a font the package no longer ships.
  const shipped = await faces();
  const expected = new Set(shipped.flatMap((f) => [f.file, `${f.pkg}.LICENSE.txt`]));
  for (const file of readdirSync(new URL('../dist/fonts/', import.meta.url))) {
    assert.ok(expected.has(file), `dist/fonts/${file} is not named by any font token`);
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

test('tailwind preset points at the variables directly', async () => {
  const { default: preset } = await import('../dist/tailwind.js');
  // No <alpha-value> slot. The variables hold real colours now, so a v4 consumer
  // gets opacity from color-mix and a v3 one gets no alpha here.
  assert.equal(preset.theme.extend.colors.primary.DEFAULT, 'var(--wl-primary)');
  for (const role of ROLES) {
    if (role === 'radius') continue; // a length, and it has its own scale below
    assert.ok(preset.theme.extend.colors[role], `tailwind preset is missing ${role}`);
  }
  assert.equal(preset.theme.extend.borderRadius.DEFAULT, 'var(--wl-radius)');
  assert.equal(preset.theme.extend.borderRadius.full, 'var(--wl-radius-full)');
});

test('the preset never silently redefines a Tailwind scale', async () => {
  // Tailwind's numeric spacing scale and this system's are both numeric and
  // they disagree from step 5 up. Shipping the system's under those keys
  // changes `p-6` and `h-9` for every consumer with no error, and the low steps
  // match, so the layout only breaks somewhere far from the cause. It did:
  // weekndlabs.com's 36px theme toggle became 96px on adoption.
  //
  // Numeric keys are the whole risk. A named key cannot collide with Tailwind's
  // spacing scale, because Tailwind's has no names.
  const { default: preset } = await import('../dist/tailwind.js');
  for (const key of Object.keys(preset.theme.extend.spacing)) {
    assert.doesNotMatch(key, /^\d/, `spacing.${key} collides with Tailwind's own scale`);
  }

  // fontFamily is the deliberate exception: sans and mono are meant to win.
  const deliberate = new Set(['fontFamily']);
  const TAILWIND_NUMERIC = ['spacing', 'lineHeight', 'fontWeight', 'zIndex', 'opacity', 'flexGrow'];
  for (const group of TAILWIND_NUMERIC) {
    if (deliberate.has(group)) continue;
    for (const key of Object.keys(preset.theme.extend[group] ?? {})) {
      assert.doesNotMatch(key, /^\d/, `${group}.${key} collides with Tailwind's own scale`);
    }
  }
});

test('ts export carries resolved values for every theme and role', async () => {
  const mod = await import('../dist/tokens.js');
  assert.deepEqual(mod.THEMES, THEMES);
  assert.deepEqual(mod.ROLES, ROLES);
  for (const theme of THEMES) {
    for (const role of ROLES) {
      assert.equal(mod.themes[theme][role], themes[theme][role], `${theme}.${role}`);
    }
  }
});
