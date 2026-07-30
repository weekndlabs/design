import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
// Deliberately the built output, not lib/tokens.js. That module imports
// style-dictionary, which is a devDependency here, and this gate is meant to run
// inside a consumer's own test suite where it would not be installed.
import { TEXT_ROLES } from '../dist/tokens.js';

/**
 * The type scale exists or it does not.
 *
 * Lifted from forgepod, where eleven arbitrary sizes served about three roles:
 * 10px and 11px both meant label, and 12/13/14/15 all meant body. Nobody added
 * them carelessly, each was one reasonable local decision, which is exactly why a
 * scale needs a gate and not good intentions. The sprawl grew from 110 to 179
 * usages between the ticket being written and being worked on.
 *
 * Two changes on the way in. The roles come from `text.*` in the tokens, so
 * adding a role is what widens the gate. And the `src/components/ui` exemption is
 * gone: a vendored component is still a component on the page.
 */
const BANNED_NAMED = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
const ARBITRARY = /\btext-\[[^\]]*px\]/g;

function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(tsx|jsx|astro|html|svelte|vue)$/.test(name)) out.push(path);
  }
  return out;
}

/**
 * @param {string} dir directory to walk
 * @returns {Promise<{file: string, line: number, found: string}[]>} every banned usage
 */
export async function checkTypography(dir) {
  const roles = new Set(TEXT_ROLES);
  // A banned name that happens to be a role is a contradiction worth failing on
  // rather than silently resolving one way.
  for (const name of BANNED_NAMED) {
    if (roles.has(name.replace('text-', ''))) throw new Error(`${name} is both banned and a role`);
  }
  const named = new RegExp(`\\b(${BANNED_NAMED.join('|')})\\b`, 'g');

  const found = [];
  for (const file of sourceFiles(dir)) {
    for (const [i, line] of readFileSync(file, 'utf8').split('\n').entries()) {
      for (const re of [ARBITRARY, named]) {
        for (const m of line.matchAll(re)) found.push({ file, line: i + 1, found: m[0] });
      }
    }
  }
  return found;
}
