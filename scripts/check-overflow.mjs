/**
 * Fails when a built docs page scrolls sideways at any width worth supporting.
 *
 * This is a script rather than part of `npm test` because it needs a browser,
 * and CI here runs `node --test` with no Chrome. Run it before shipping a
 * change to the site: `npm run check:overflow`.
 *
 * Two things about it are not obvious, and both were learned the hard way.
 *
 * The page is loaded inside an iframe of the target width rather than by
 * resizing the browser window. Headless Chrome clamps its window to a 500px
 * minimum, so `--window-size=390,3000` lays the page out at 500 and then crops
 * the image to 390. Every narrow screenshot taken that way is a lie: it shows
 * content cut off that is not cut off, and hides overflow that is.
 *
 * An element inside a box that scrolls on the x axis is ignored. A filter row
 * with `overflow-x: auto` is meant to run past its container, and so is a
 * terminal block. Reporting those drowns the real failures.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../docs/dist/', import.meta.url));
const PAGES = ['/', '/components/', '/guide/'];
const WIDTHS = [280, 320, 360, 375, 390, 414, 430, 480, 540, 600, 768, 860, 1024, 1280];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml',
  '.txt': 'text/plain',
};

async function serve() {
  const server = createServer(async (req, res) => {
    const [rawPath, query] = req.url.split('?');
    // The harness has to come from this origin too. A file:// page holding an
    // http:// iframe is cross-origin, contentDocument is null, and the run
    // fails with no measurements and no obvious reason.
    if (rawPath === '/__harness') {
      const page = new URLSearchParams(query).get('page') ?? '/';
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(harness(page));
    }
    const path = normalize(decodeURIComponent(rawPath)).replace(/^(\.\.[/\\])+/, '');
    for (const candidate of [join(ROOT, path), join(ROOT, path, 'index.html')]) {
      try {
        if (!(await stat(candidate)).isFile()) continue;
        res.writeHead(200, { 'content-type': TYPES[extname(candidate)] ?? 'application/octet-stream' });
        return res.end(await readFile(candidate));
      } catch {}
    }
    res.writeHead(404).end('not found');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, port: server.address().port };
}

/**
 * The harness page: one iframe at a time, created, awaited, measured, removed.
 *
 * Two cheaper shapes were tried and both lie. Resizing a single iframe reports
 * the same stale scrollWidth at every width, because the child does not relayout
 * when the parent attribute changes. Creating all fourteen up front reports the
 * same number too, and names the wrong element as the cause. Sequential frames
 * have no ordering left to get wrong, and the page is fetched once and cached.
 */
const harness = (page) => `<!doctype html><meta charset="utf-8">
<div id="stage" style="position:absolute;left:-99999px;top:0"></div>
<pre id="out"></pre>
<script>
const widths = ${JSON.stringify(WIDTHS)};
const stage = document.getElementById('stage');
const scrolls = (el) => ['auto', 'scroll', 'hidden'].includes(getComputedStyle(el).overflowX);

function inspect(d, view) {
  const rows = [];
  for (const el of d.querySelectorAll('*')) {
    const right = el.getBoundingClientRect().right;
    if (right <= view + 1) continue;
    // An element inside an x-scrolling box is meant to run past its container.
    // Reporting those buries the ones that actually widen the page.
    let clipped = false;
    for (let n = el.parentElement; n; n = n.parentElement) if (scrolls(n)) { clipped = true; break; }
    if (clipped) continue;
    rows.push({
      right: Math.round(right),
      width: Math.round(el.getBoundingClientRect().width),
      sel: el.tagName.toLowerCase() + (el.getAttribute('class') ? '.' + el.getAttribute('class').trim().split(/\s+/).join('.') : ''),
    });
  }
  // Widest first. The first element in document order is usually a wrapper that
  // is only wide because something inside it is.
  rows.sort((a, b) => b.width - a.width);
  return rows[0] ?? null;
}

(async () => {
  const rows = [];
  for (const width of widths) {
    const f = document.createElement('iframe');
    f.width = width;
    f.height = 900;
    f.style.border = '0';
    await new Promise((resolve) => {
      f.addEventListener('load', resolve, { once: true });
      f.src = ${JSON.stringify('PAGE')}.replace('PAGE', '') + ${JSON.stringify(page)};
      stage.append(f);
    });
    const d = f.contentDocument;
    const view = d.documentElement.clientWidth;
    const scroll = d.documentElement.scrollWidth;
    rows.push({ width, view, scroll, culprit: scroll > view ? inspect(d, view) : null });
    f.remove();
  }
  document.getElementById('out').textContent = JSON.stringify(rows);
})();
</script>`;

async function measure(origin, page) {
  const out = await new Promise((resolve, reject) => {
    const chunks = [];
    const chrome = spawn(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--dump-dom',
      '--virtual-time-budget=8000', `${origin}/__harness?page=${encodeURIComponent(page)}`,
    ]);
    chrome.stdout.on('data', (c) => chunks.push(c));
    chrome.on('error', reject);
    chrome.on('close', () => resolve(Buffer.concat(chunks).toString()));
  });
  const json = /<pre id="out">(.*?)<\/pre>/s.exec(out)?.[1];
  if (!json) throw new Error(`no measurements came back for ${page}. Is Chrome at ${CHROME}?`);
  return JSON.parse(json.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
}

const { server, port } = await serve();
const origin = `http://127.0.0.1:${port}`;
let failed = 0;

try {
  for (const page of PAGES) {
    let bad = 0;
    for (const { width, view, scroll, culprit } of await measure(origin, page)) {
      const over = scroll - view;
      if (over > 0) {
        bad++;
        console.error(`FAIL ${page} at ${width}: scrollWidth ${scroll} exceeds ${view} by ${over}px` +
          (culprit ? `, widest offender ${culprit.sel} at ${culprit.width}px` : ''));
      }
    }
    failed += bad;
    if (!bad) console.log(`ok   ${page} across ${WIDTHS.length} widths, ${WIDTHS[0]} to ${WIDTHS.at(-1)}`);
  }
} finally {
  server.close();
}

if (failed) {
  console.error(`\n${failed} width/page combinations scroll sideways.`);
  process.exit(1);
}
console.log('\nno page scrolls sideways at any width checked.');
