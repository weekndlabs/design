import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  // Tailwind is here for one reason: the components page has to compile
  // dist/shadcn.css for real. A bridge nobody compiles is a bridge nobody has
  // tested.
  vite: { plugins: [tailwind()] },
  // Shiki ships its own palette and paints code blocks with an inline
  // background, which lands a github-dark box on a paper-coloured page. The
  // system already has an answer for machine output: the `terminal` trio, the one
  // set of colours identical in all three themes. Highlighting off, tokens on.
  markdown: { syntaxHighlight: false },
});
