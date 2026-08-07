import StyleDictionary from 'style-dictionary';
import { SOURCE } from '../lib/tokens.js';
import { formatCss } from './format-css.js';
import { formatTailwind } from './format-tailwind.js';
import { formatTs } from './format-ts.js';
import { formatShadcn } from './format-shadcn.js';
import { formatDts, formatTailwindDts } from './format-dts.js';
import { formatMarketing, formatCatalog } from './format-archetype.js';
import { buildFonts } from './fonts.js';
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sd = new StyleDictionary({
  source: SOURCE,
  hooks: {
    formats: {
      'wl/css': formatCss,
      'wl/tailwind': formatTailwind,
      'wl/ts': formatTs,
      'wl/shadcn': formatShadcn,
      'wl/dts': formatDts,
      'wl/tailwind-dts': formatTailwindDts,
      'wl/marketing': formatMarketing,
      'wl/catalog': formatCatalog,
    },
  },
  platforms: {
    web: {
      // Names come from the full path. Without this, Style Dictionary derives a
      // token's name from its last path segment, so `dark.background` and
      // `paper.background` collide and every build prints a collision warning.
      // The formats below read `path` rather than `name`, so this only quiets
      // the warning; it does not change a single emitted value.
      transforms: ['name/kebab'],
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.css', format: 'wl/css' },
        { destination: 'tailwind.js', format: 'wl/tailwind' },
        { destination: 'tokens.js', format: 'wl/ts' },
        { destination: 'shadcn.css', format: 'wl/shadcn' },
        { destination: 'tokens.d.ts', format: 'wl/dts' },
        { destination: 'tailwind.d.ts', format: 'wl/tailwind-dts' },
        { destination: 'marketing.css', format: 'wl/marketing' },
        { destination: 'catalog.css', format: 'wl/catalog' },
      ],
    },
  },
});

await sd.buildAllPlatforms();
await buildFonts();

// Hand-written, so it is copied rather than generated. lib/components.test.js
// is what holds it to the tokens.
copyFileSync(
  fileURLToPath(new URL('../css/components.css', import.meta.url)),
  fileURLToPath(new URL('../dist/components.css', import.meta.url))
);
console.log('built dist/');
