import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

/**
 * The canonical origin, and the only place it is written down.
 *
 * The page answers on two hosts, design.weekndlabs.com and
 * weekndlabs.com/design. Exactly one can be the indexable one, and every
 * canonical tag and every sitemap entry has to name the same one or Google is
 * told to index a host nothing links to.
 *
 * weekndlabs.com/design won: every inbound link and every internal link already
 * points there, and one domain is easier to grow than two.
 *
 * It is written with a trailing slash on purpose. `new URL('/guide/', base)`
 * throws away the base path and yields weekndlabs.com/guide, so the join has to
 * be relative and the base has to end in a slash for it to survive. Page.astro
 * and the sitemap both depend on that.
 *
 * `base` is deliberately NOT set. This same build is also served at the
 * subdomain root, where a base of /design would send every asset to a 404.
 */
const SITE = 'https://weekndlabs.com/design/';

export default defineConfig({
  site: SITE,
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
