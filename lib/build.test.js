import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { faces } from '../build/fonts.js';
import { loadScale, loadThemes, THEMES, ROLES } from './tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const fontsCss = readFileSync(new URL('../dist/fonts.css', import.meta.url), 'utf8');
const shadcnCss = readFileSync(new URL('../dist/shadcn.css', import.meta.url), 'utf8');
const themes = await loadThemes();

/** Token values carry `.`, `(` and `-`, so they cannot go into a regex raw. */
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('css emits a block per theme', () => {
  assert.match(css, /\[data-theme='light'\]/);
  assert.match(css, /\[data-theme='dark'\]/);
  assert.match(css, /\[data-theme='paper'\]/);
  assert.doesNotMatch(css, /night-|receipt/, 'an old theme name survived into the output');
});

test('css emits oklch, never hex and never a bare triplet', () => {
  assert.doesNotMatch(css, /#[0-9A-Fa-f]{6}/, 'a hex leaked into the CSS output');
  assert.match(css, /--wl-primary:\s*oklch\([\d.]+ [\d.]+ [\d.]+\);/);
});

test('css carries the shared scale as well as the colours', () => {
  for (const variable of [
    '--wl-space-5', '--wl-radius-full', '--wl-measure-page',
    '--wl-text-hero', '--wl-tracking-label',
    '--wl-font-ui-body', '--wl-font-paper-mono',
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
  const unthemed = (await loadScale()).map(({ path, value }) => [`--wl-${path.join('-')}`, value]);
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

test('the radius ladder is a theme token, and only the pill stays shared', async () => {
  // The steps vary per theme, which nothing else in space.json does. Leaving
  // them there would mean one radius for a system whose themes disagree about
  // corners. `full` is different: a pill is 9999px in every theme, so removing
  // it would take rounded-full away for no reason.
  const radius = (await loadScale()).filter((t) => t.path[0] === 'radius').map((t) => t.path[1]);
  assert.deepEqual(radius, ['full']);
  for (const theme of THEMES) {
    assert.match(themes[theme].radius, /^\d+px$/, `${theme} has no radius of its own`);
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
  // Two body families at 400/500/600, two display faces at 700, two mono at 400.
  assert.equal(shipped.length, 10, `expected ten faces, got ${shipped.length}`);

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
