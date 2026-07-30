import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  // Shiki ships its own palette and paints code blocks with an inline
  // background, which lands a github-dark box on a paper-coloured page. The
  // system already has an answer for machine output: the `terminal` trio, the one
  // set of colours identical in all three themes. Highlighting off, tokens on.
  markdown: { syntaxHighlight: false },
});
