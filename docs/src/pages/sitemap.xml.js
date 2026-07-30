/**
 * The sitemap, emitted by hand.
 *
 * @astrojs/sitemap was tried first and removed. It joins each route onto `site`
 * with a leading slash, which throws away a path in the origin: with
 * `site: 'https://weekndlabs.com/design/'` it emitted `weekndlabs.com/guide/` and
 * `weekndlabs.com/sitemap-0.xml`, neither of which exists. Setting Astro's `base`
 * would fix the join and break everything else, because this same build is also
 * served at the subdomain root where `/design/_astro/…` is a 404.
 *
 * Three URLs did not justify configuring around that, so this file joins them the
 * one way that survives a path: relative, onto a base ending in a slash.
 *
 * The routes come from the pages directory rather than a list here, so adding a
 * page adds it to the sitemap.
 */
const pages = import.meta.glob('./*.astro', { eager: true });

/** `./index.astro` -> ``, `./guide.astro` -> `guide/` */
const routeOf = (file) => {
  const name = file.replace(/^\.\//, '').replace(/\.astro$/, '');
  return name === 'index' ? '' : `${name}/`;
};

export function GET({ site }) {
  const urls = Object.keys(pages)
    .map(routeOf)
    .sort()
    .map((route) => `  <url><loc>${new URL(route, site).href}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
