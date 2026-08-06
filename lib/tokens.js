import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';

export const THEMES = ['light', 'dark'];

/**
 * shadcn's role vocabulary, so copied shadcn code needs no translation, plus the
 * roles shadcn has no name for.
 *
 * Every `X-foreground` is asserted against `X` by the gate in tokens.test.js.
 * The pairing is the naming convention, which is why the gate can derive the
 * list instead of carrying one that someone has to remember to extend.
 */
export const ROLES = [
  'background', 'foreground',
  'card', 'card-foreground',
  'popover', 'popover-foreground',
  'primary', 'primary-foreground',
  'secondary', 'secondary-foreground',
  'muted', 'muted-foreground',
  'accent', 'accent-foreground',
  'destructive', 'destructive-foreground',
  'success', 'success-foreground',
  'warning', 'warning-foreground',
  'border', 'input', 'ring',
  'sidebar', 'sidebar-foreground', 'sidebar-accent', 'sidebar-accent-foreground',
  'sidebar-border', 'sidebar-ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  // A length, not a colour. It lives here because it varies by theme, which is
  // the thing this list is keyed on.
  'radius',
];

/**
 * The terminal, which shadcn has no name for and this system keeps anyway.
 *
 * It is not themed. One ground means one set of ratios to hold; the same palette
 * over a white ground tops out at 2.87:1 and every colour in it fails.
 */
export const TERMINAL = [
  'ground', 'foreground', 'dim',
  'red', 'green', 'yellow', 'blue', 'magenta', 'cyan',
  'selection',
];

/** Absolute glob, so the token source resolves the same from any cwd. */
export const SOURCE = [fileURLToPath(new URL('../tokens/*.json', import.meta.url))];

/**
 * Resolved theme values, keyed theme -> role -> hex.
 *
 * Uses Style Dictionary to resolve the {color.x.y} references so the tests
 * assert the same graph the build emits, not a second hand-maintained copy.
 */
// A platform must exist for the reference resolver to run, but it needs no
// transforms: values stay exactly as authored, which is what the assertions
// compare. `getPlatformTokens` is the 5.x API; `exportPlatform` is deprecated.
async function platformTokens() {
  const sd = new StyleDictionary({ source: SOURCE, platforms: { _: {} } });
  await sd.hasInitialized;
  return sd.getPlatformTokens('_');
}

/**
 * Every token that is not a colour, flat, as authored. These are the unthemed
 * half of the system: one value each, shared by all three themes.
 */
export async function loadScale() {
  const { allTokens } = await platformTokens();
  return allTokens
    .filter((t) => t.path[0] !== 'color')
    .map((t) => ({ path: t.path, value: t.value ?? t.$value }));
}

/** The terminal group, keyed role -> value. Shared by both themes. */
export async function loadTerminal() {
  const { tokens } = await platformTokens();

  const out = {};
  for (const [role, node] of Object.entries(tokens?.color?.terminal ?? {})) {
    out[role] = node.value ?? node.$value;
  }
  return out;
}

export async function loadThemes() {
  const { tokens } = await platformTokens();

  const out = {};
  for (const theme of THEMES) {
    out[theme] = {};
    for (const [role, node] of Object.entries(tokens?.color?.theme?.[theme] ?? {})) {
      out[theme][role] = node.value ?? node.$value;
    }
  }
  return out;
}
