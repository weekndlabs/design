import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';

export const THEMES = ['night-dark', 'night-light', 'receipt'];

export const ROLES = [
  'surface', 'surface-panel', 'surface-sunk',
  'ink', 'ink-soft',
  'rule', 'rule-soft', 'rule-strong',
  'accent', 'accent-strong',
  'inset', 'inset-ink', 'inset-ink-dim',
  'positive', 'negative',
];

/** Absolute glob, so the token source resolves the same from any cwd. */
export const SOURCE = [fileURLToPath(new URL('../tokens/*.json', import.meta.url))];

/**
 * Resolved theme values, keyed theme -> role -> hex.
 *
 * Uses Style Dictionary to resolve the {color.x.y} references so the tests
 * assert the same graph the build emits, not a second hand-maintained copy.
 */
export async function loadThemes() {
  // A platform must exist for the reference resolver to run, but it needs no
  // transforms: values stay exactly as authored, which is what the assertions
  // compare. `getPlatformTokens` is the 5.x API; `exportPlatform` is deprecated.
  const sd = new StyleDictionary({ source: SOURCE, platforms: { _: {} } });
  await sd.hasInitialized;
  const { tokens } = await sd.getPlatformTokens('_');

  const out = {};
  for (const theme of THEMES) {
    out[theme] = {};
    for (const [role, node] of Object.entries(tokens?.color?.theme?.[theme] ?? {})) {
      out[theme][role] = node.value ?? node.$value;
    }
  }
  return out;
}
