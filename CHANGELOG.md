# Changelog

## 0.4.0

Breaking. Every colour in the system changed, `paper` is gone, and six typefaces
became three. Role names did not change, so a component that names roles needs
no edit and simply looks different.

### The identity

One neutral ladder and one system blue replace `sand`, `navy`, `stone`, `amber`,
`phosphor` and `black.crt`. Themes are `light` and `dark`.

`primary` is ink, inverted per theme, so a filled pill is the only solid button
on a page. Blue carries `ring` and `chart-1`. If you were using `primary` as a
colour accent rather than as the button, you want `ring`.

The blue is measured, not copied. Apple's `systemBlue` `#007AFF` fails AA on
white at 4.02:1, and `#0071E3` fails on the muted surface at 4.31:1. `#006CDB`
and `#409CFF` clear every surface they are allowed on.

### Corners

`radius` gains `control` 6px, `card` 10px and `window` 14px beside `full`, and
`corner.shape` ships `squircle`. A browser without `corner-shape` keeps the
radius, so no guard is needed at the call site. `--wl-radius` still exists, still
equals `radius.card`, and a test ties them together.

### Type

| 0.3.x | 0.4.0 |
|---|---|
| `--wl-font-ui-body`, `--wl-font-ui-display` | `--wl-font-sans` |
| `--wl-font-ui-mono` | `--wl-font-mono` |
| `--wl-font-paper-*` | gone with the theme |
| new | `--wl-font-accent`, Instrument Serif italic |

Inter now ships as one variable file with the optical size axis, which is why one
sans covers both display and body. Three woff2 at 113KB, down from ten at 215KB.

### Terminal

| 0.3.x | 0.4.0 |
|---|---|
| `--wl-terminal` | `--wl-terminal-ground` |
| `--wl-terminal-foreground` | unchanged |
| `--wl-terminal-foreground-muted` | `--wl-terminal-dim` |
| new | `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `selection` |

Still unthemed, for the reason it always was. In Tailwind the ground is the
default, so `bg-terminal` and `text-terminal-green` both compile.

### Container widths

New: `narrow` 640px, `medium` 900px, `wide` 1280px. They ship as data in
`tokens.js` and as `--container-*` literals in `shadcn.css`, and deliberately not
as `--wl-*` variables, because `@container` cannot read a custom property and
fails by never matching.

### Themes

`data-theme="paper"` no longer resolves. Use `light` or `dark`. Omni keeps its
paper stock in its own stylesheet, where it was always a product argument rather
than a system one.

### Tests

Four gates added, two of which failed on the values this release was specified
with, before it shipped:

- neutral chroma capped at 0.008, so a dark theme cannot drift toward a hue while
  its light twin stays neutral
- the terminal palette measured on its own ground, with the six colours held 25
  degrees apart in hue. This moved cyan from 228 to 204 degrees, where it had sat
  24.9 degrees from blue
- every terminal role must reach every output format. They had been emitted by
  nothing and resolved to nothing in a browser
- `dist/fonts/` may hold nothing the tokens name, because the build copies and
  never deletes

`npm run check:overflow` is new and needs Chrome, so it is a script rather than
part of `npm test`. It loads each built docs page in an iframe at fourteen widths
from 280 to 1280 and fails on sideways scroll. It found two on its first run.

## 0.4.1

Fixes one thing, found by the first consumer to adopt 0.4.0.

The Tailwind preset shipped the spacing scale under numeric keys, which
redefined Tailwind's own. The two ladders agree at steps 1 to 4 and diverge
after: step 5 is 24px against Tailwind's 20px, step 9 is 96px against 36px. So
`h-9` on weekndlabs.com's theme toggle went from 36px to 96px, and the low steps
matching is what made it look fine everywhere else.

Spacing utilities are now `p-wl-5`, `gap-wl-4` and so on. A gate rejects any
numeric key in a preset group whose Tailwind counterpart is numeric.

## 0.3.1

Radius ladder mapped in full for shadcn, and the components page added.

## 0.3.0

shadcn role vocabulary, themes renamed to `light`, `dark` and `paper`, colour
values moved to oklch.

## 0.2.1

First npm release.
