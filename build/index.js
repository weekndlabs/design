import StyleDictionary from 'style-dictionary';
import { SOURCE } from '../lib/tokens.js';
import { formatCss } from './format-css.js';
import { formatTailwind } from './format-tailwind.js';
import { formatTs } from './format-ts.js';
import { formatShadcn } from './format-shadcn.js';
import { buildFonts } from './fonts.js';

const sd = new StyleDictionary({
  source: SOURCE,
  hooks: {
    formats: {
      'wl/css': formatCss,
      'wl/tailwind': formatTailwind,
      'wl/ts': formatTs,
      'wl/shadcn': formatShadcn,
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
      ],
    },
  },
});

await sd.buildAllPlatforms();
await buildFonts();
console.log('built dist/');
