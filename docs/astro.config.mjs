import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * The canonical host, and the only place it is written down.
 *
 * The page answers on two hosts, design.weekndlabs.com and
 * weekndlabs.com/design. Exactly one of them can be the indexable one, and every
 * canonical tag and every sitemap entry has to name the same one or Google is
 * told to index a host nothing links to.
 *
 * Page.astro reads this through `Astro.site`, and the sitemap is generated from
 * it, so choosing the other host is a one-line change here.
 */
const SITE = 'https://design.weekndlabs.com';

export default defineConfig({
  site: SITE,
  srcDir: './src',
  outDir: './dist',
  // Without this there was no sitemap at all: weekndlabs.com/sitemap.xml lists
  // four URLs and none of them is a design page, and this host answered 404.
  // Discovery rested on a single navbar link.
  integrations: [sitemap()],
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
