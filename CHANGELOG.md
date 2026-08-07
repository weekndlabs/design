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

## 0.5.0

The layers the tokens were always for. Nothing in 0.4.x changes meaning, so a
consumer on 0.4.0 can take this and import nothing new.

### Components, `@weekndlabs/design/components.css`

Closes #23. Thirty controls as `.wl-*` classes, in two tiers. Styling only:
opening, closing and focus trapping stay with the consumer. Where the platform
has the element, these style that element rather than a div, so `<dialog>`
brings the focus trap and `<details>` brings the accordion's state.

Four rules, each a test: every value is a token, every control clears 44px,
focus is visible and `outline: none` is refused, and hover sits behind
`@media (hover: hover)`.

### Prose, `@weekndlabs/design/prose.css`

Closes #24. `.wl-prose`, moved out of the docs site, where it meant any other
product rendering markdown wrote it again or went without.

### Archetypes, `marketing.css` and `catalog.css`

Two page vocabularies over one unchanged core, scoped to a class so a page can
hold both. The marketing hero gradient derives from `--wl-ring` rather than
being a colour of its own. A test fails if an archetype token reaches the core.

### Types

Closes #33. `dist/tokens.d.ts` is generated beside the values, so the `Role`
union is the `ROLES` array and cannot drift. `tailwindcss` becomes an optional
peer, since only a consumer importing the preset resolves its declaration.

### Figma, `dist/tokens.figma.json`

Partly closes #25. The tokens in W3C Design Tokens format, colour carrying a
mode per theme in one collection. The library itself still needs an account
this machine does not have.

### New tokens

`duration` fast, base and slow. `ease` out and in-out. `icon` sm, md and a
stroke width. All three exist because the components needed them.

### Breaking, and only if you took an unpublished 0.4.1

Spacing utilities in the Tailwind preset are `p-wl-5`, not `p-5`. 0.4.1 was
tagged and never published, so this reaches npm for the first time here. The
reason is in that entry below.

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
