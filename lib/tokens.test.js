import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from './contrast.js';
import { loadThemes, loadTerminal, THEMES, ROLES, TERMINAL } from './tokens.js';

const themes = await loadThemes();
const terminal = await loadTerminal();

/**
 * Body text gets 7:1 and everything else 4.5:1.
 *
 * The pairs are not listed here. `X-foreground` must clear its threshold on `X`,
 * which is the naming convention, so the gate reads the names and cannot miss a
 * pair someone forgot to add.
 */
const AA = 4.5;
const AAA = 7.0;
const SURFACE_THRESHOLD = {
  foreground: AAA,
  'card-foreground': AAA,
  'popover-foreground': AAA,
  'sidebar-foreground': AAA,
};

/** Marks, not text. A hairline at 2:1 is correct and would be wrong for text. */
const NOT_TEXT = new Set([
  'border', 'input', 'ring', 'radius',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
]);

/** oklch stores hue as its third component, in degrees. */
const hueOf = (value) => Number(/^oklch\([\d.]+ [\d.]+ ([\d.]+)\)$/.exec(value)[1]);
/** And chroma as its second. */
const chromaOf = (value) => Number(/^oklch\([\d.]+ ([\d.]+) /.exec(value)[1]);

/** The roles that are meant to have no hue of their own. */
const NEUTRAL = new Set([
  'background', 'foreground', 'card', 'card-foreground',
  'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'border', 'input',
  'sidebar', 'sidebar-foreground', 'sidebar-accent', 'sidebar-accent-foreground',
  'sidebar-border',
]);
const degreesApart = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// `foreground` is paired by hand because it is the only one whose surface is not
// its own name minus a suffix. Everything else derives.
//
// The pattern has to allow a trailing modifier: terminal-foreground-muted is a
// text role, and a plain endsWith('-foreground') silently drops it. That is the
// failure this gate exists to prevent, so it would have been a poor first bug.
const FOREGROUND = /-foreground(-[a-z]+)?$/;
const pairs = [
  { fg: 'foreground', bg: 'background' },
  ...ROLES.filter((r) => FOREGROUND.test(r)).map((fg) => ({
    fg,
    bg: fg.replace(FOREGROUND, ''),
  })),
];

test('themes are modes, and no brand or material name survives', () => {
  assert.deepEqual(THEMES, ['light', 'dark']);
  for (const theme of THEMES) {
    assert.doesNotMatch(theme, /night|receipt|paper/, `${theme} still carries an old name`);
  }
});

test('every role shadcn requires is defined', () => {
  for (const role of [
    'background', 'foreground',
    'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
    'muted', 'muted-foreground', 'accent', 'accent-foreground',
    'destructive', 'destructive-foreground', 'border', 'input', 'ring',
  ]) {
    assert.ok(ROLES.includes(role), `shadcn needs ${role} and the system does not define it`);
  }
});

test('accent is the dim hover surface, not the brand', () => {
  // The trap in this rename. In this system accent used to BE the amber. In
  // shadcn, --accent is the hover wash and --primary carries the brand. Mapped
  // straight across, every dropdown and command palette hover turns amber.
  for (const theme of THEMES) {
    assert.equal(themes[theme].accent, themes[theme].muted, `${theme}: accent must track muted`);
    assert.notEqual(themes[theme].accent, themes[theme].primary, `${theme}: accent took the brand`);
  }
});

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
      if (role === 'radius') continue; // a length, and the only one in this list
      assert.match(value, /^oklch\(\d/, `${theme}.${role} = ${value}`);
    }
  }
});

test('the derived pair list covers every foreground role', () => {
  assert.equal(pairs.length, 12, `${pairs.length} pairs derived, the naming broke`);
  for (const { bg } of pairs) {
    assert.ok(ROLES.includes(bg), `${bg} is implied by a -foreground role and does not exist`);
  }
});

test('every foreground clears its threshold on its own surface', () => {
  for (const theme of THEMES) {
    for (const { fg, bg } of pairs) {
      const min = SURFACE_THRESHOLD[fg] ?? AA;
      const ratio = contrastRatio(themes[theme][fg], themes[theme][bg]);
      assert.ok(ratio >= min, `${theme}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1, need ${min}`);
    }
  }
});

test('muted-foreground clears AA on every surface it can land on', () => {
  for (const theme of THEMES) {
    for (const bg of ['background', 'card', 'muted', 'sidebar']) {
      const ratio = contrastRatio(themes[theme]['muted-foreground'], themes[theme][bg]);
      assert.ok(ratio >= AA, `${theme}: muted-foreground on ${bg} = ${ratio.toFixed(2)}:1`);
    }
  }
});

test('foreground stays legible on card and muted, not only on background', () => {
  for (const theme of THEMES) {
    for (const bg of ['card', 'muted', 'sidebar']) {
      const ratio = contrastRatio(themes[theme].foreground, themes[theme][bg]);
      assert.ok(ratio >= AAA, `${theme}: foreground on ${bg} = ${ratio.toFixed(2)}:1, need 7`);
    }
  }
});

test('banded surfaces stay distinguishable from the page', () => {
  // A surface that measures identical to the page is a token with no effect.
  // 1.03:1 is roughly the smallest step that survives a cheap display.
  for (const theme of THEMES) {
    for (const role of ['card', 'muted', 'sidebar']) {
      const ratio = contrastRatio(themes[theme][role], themes[theme].background);
      assert.ok(ratio >= 1.03, `${theme}.${role} = ${ratio.toFixed(3)}:1 against background`);
    }
  }
});

test('marks carry no text threshold', () => {
  // border on paper is roughly 2:1 against the page. That is correct for a
  // hairline and would be wrong for text, so no mark may appear as a pair.
  for (const role of NOT_TEXT) {
    assert.ok(!pairs.some((p) => p.fg === role), `${role} must not be asserted as text`);
  }
});

test('no neutral carries a visible hue', () => {
  // Apple's greys sit near 0.004 chroma and still read as grey. Past 0.008 a
  // theme starts leaning toward a colour, and the usual way this fails is a dark
  // theme drifting blue while its light twin stays neutral. Nobody sees that
  // without putting the two side by side, which is why it is a number here.
  for (const theme of THEMES) {
    for (const role of NEUTRAL) {
      const chroma = chromaOf(themes[theme][role]);
      assert.ok(chroma <= 0.008, `${theme}.${role} chroma is ${chroma}, ceiling is 0.008`);
    }
  }
});

test('the terminal defines every role it declares, and nothing else', () => {
  assert.deepEqual(Object.keys(terminal).sort(), [...TERMINAL].sort());
});

test('every terminal colour clears AA on the terminal ground', () => {
  // selection is a fill behind text rather than text, so it is not measured here.
  for (const role of TERMINAL) {
    if (role === 'ground' || role === 'selection') continue;
    const ratio = contrastRatio(terminal[role], terminal.ground);
    assert.ok(ratio >= AA, `terminal-${role} on the ground = ${ratio.toFixed(2)}:1, need ${AA}`);
  }
});

test('the terminal ground is the dark card, not a second near black', () => {
  // Two near blacks a few percent apart look like a rendering fault when a
  // terminal block sits inside a dark card, and no contrast test can see it.
  assert.equal(terminal.ground, themes.dark.card);
});

test('terminal colours are separated from each other by hue', () => {
  // Output uses them together, one word each. Two colours a few degrees apart
  // are a colour-blind trap and read as the same status at a glance.
  const hues = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];
  for (const [i, a] of hues.entries()) {
    for (const b of hues.slice(i + 1)) {
      const gap = degreesApart(hueOf(terminal[a]), hueOf(terminal[b]));
      assert.ok(gap >= 25, `terminal ${a} and ${b} are ${gap.toFixed(1)} degrees apart, need 25`);
    }
  }
});

test('warning does not read as the brand', () => {
  // A contrast ratio cannot catch this: two colours can share a luminance and
  // still be obviously different hues, and amber is both this system's brand and
  // the conventional warning colour. So the check is on hue.
  for (const theme of THEMES) {
    const gap = degreesApart(hueOf(themes[theme].warning), hueOf(themes[theme].primary));
    assert.ok(gap >= 20, `${theme}: warning is ${gap.toFixed(1)} degrees from primary, need 20`);
  }
});

test('chart marks are visible on the page and separated from each other by hue', () => {
  // Separation is measured in hue, not contrast. A good categorical palette
  // often holds lightness steady on purpose, so a luminance test here would
  // reject the palettes that are actually correct. Visibility against the page
  // IS a luminance question, so that half stays a contrast ratio.
  const charts = ROLES.filter((r) => r.startsWith('chart-'));
  assert.equal(charts.length, 5);
  for (const theme of THEMES) {
    for (const role of charts) {
      const ratio = contrastRatio(themes[theme][role], themes[theme].background);
      assert.ok(ratio >= 1.5, `${theme}.${role} = ${ratio.toFixed(2)}:1 against background`);
    }
    for (const [i, a] of charts.entries()) {
      for (const b of charts.slice(i + 1)) {
        const gap = degreesApart(hueOf(themes[theme][a]), hueOf(themes[theme][b]));
        assert.ok(gap >= 25, `${theme}: ${a} and ${b} are ${gap.toFixed(1)} degrees apart, need 25`);
      }
    }
  }
});
