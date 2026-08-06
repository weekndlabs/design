# 0.4.0: a macOS identity

Status: approved 2026-08-01, not implemented.

Every ratio in this document was computed with `lib/contrast.js`, not estimated.

## Why

WeekndLabs ships Mac software and AI tooling. The system it uses today was
assembled from three products that already existed, so it carries three colour
families, three themes and six typefaces, and it does not look like anything in
particular. This replaces that with one identity, chosen rather than inherited.

Nothing consumes the package yet beyond the docs site, so the cost of the pivot
will never be lower than it is now.

## What goes

| Removed | Replaced by |
| --- | --- |
| `sand`, `navy`, `stone`, `amber`, `phosphor`, `black.crt` | one neutral ladder, one system blue |
| theme `paper` | nothing. Omni keeps its paper stock in its own stylesheet |
| `terminal`, `terminal-foreground`, `terminal-foreground-muted` | ten terminal tokens, see below |
| Bricolage Grotesque, IBM Plex Sans, Plex Sans Condensed, Plex Mono | Inter |
| `font.ui.*` and `font.paper.*` split | `font.sans`, `font.mono`, `font.accent` |
| six woff2 shipped | three, and only two load on a normal page |

What survives: the three layer architecture, the shadcn role names, contrast as a
test rather than a comment, and the rule that mono means a machine emitted it.

## Core tokens

These apply to every product and every page.

### Colour

Themes are `light` and `dark`. Nothing else.

| Role | light | dark |
| --- | --- | --- |
| background | `#FAFAFA` `oklch(0.9851 0 0)` | `#141416` `oklch(0.1921 0.004 286.02)` |
| card, popover | `#FFFFFF` `oklch(1 0 0)` | `#1C1C1E` `oklch(0.2273 0.0038 286.09)` |
| secondary, muted, accent | `#F5F5F5` `oklch(0.9702 0 0)` | `#2C2C2E` `oklch(0.2939 0.0036 286.18)` |
| border | `#E5E5E5` `oklch(0.9219 0 0)` | `#3A3A3C` `oklch(0.3492 0.0034 286.22)` |
| input | `#D4D4D4` `oklch(0.8699 0 0)` | `#48484A` `oklch(0.4024 0.0033 286.25)` |
| foreground | `#1D1D1F` `oklch(0.2316 0.0038 286.1)` | `#F5F5F7` `oklch(0.9707 0.0027 286.35)` |
| muted-foreground | `#6E6E73` `oklch(0.5399 0.0077 286.14)` | `#98989D` `oklch(0.6812 0.0073 286.21)` |
| primary | same as foreground | same as foreground |
| primary-foreground | `#FFFFFF` | `#1C1C1E` |
| ring, chart-1, link | `#006CDB` `oklch(0.5462 0.1891 256.36)` | `#409CFF` `oklch(0.6854 0.1699 252.99)` |
| success | `#1E7A45` `oklch(0.5135 0.1185 153.14)` | `#4ED17F` `oklch(0.7685 0.1643 152.62)` |
| warning | `#8A5A00` `oklch(0.5078 0.108 73.3)` | `#F0B84A` `oklch(0.8143 0.1396 81.16)` |
| destructive | `#B3261E` `oklch(0.5013 0.1783 28.7)` | `#FF6B60` `oklch(0.7097 0.1828 26.96)` |

Measured on the dimmest surface each colour is allowed to sit on, which is
`#F5F5F5` in light and `#2C2C2E` in dark:

| Colour | light | dark |
| --- | --- | --- |
| foreground | 15.44 | 12.80 |
| muted-foreground | 4.65 | 4.85 |
| ring, link | 4.62 | 4.92 |
| success | 4.91 | 7.13 |
| warning | 5.44 | 7.74 |
| destructive | 6.00 | 4.99 |

`primary` is ink, not blue. A filled ink pill is the only solid button on a page,
and blue is left to do what it does on macOS: focus rings, links, selection, and
the first chart series. Consumers arriving from shadcn expect `primary` to carry
a brand hue and will get a black button instead. That is the intent.

Two findings that decided the blue:

- Apple's `systemBlue` `#007AFF` fails AA on white at 4.02:1.
- The blue apple.com uses, `#0071E3`, passes on white at 4.70:1 but fails on the
  muted surface at 4.31:1. In dark, `#0A84FF` fails the same way at 3.82:1.

So the values are `#006CDB` and `#409CFF`, which clear every surface they are
allowed on. Both still read as system blue.

The test gains one rule. No neutral token may carry chroma above 0.008. The
values above sit between 0 and 0.004, which is invisible, and the ceiling is what
stops a dark theme drifting toward blue while its light twin stays grey. That
failure is common and nobody notices it by eye.

### Type

| Token | Value |
| --- | --- |
| `font.sans` | Inter, variable, `opsz` and `wght` axes |
| `font.mono` | JetBrains Mono |
| `font.accent` | Instrument Serif italic, marketing archetype only |

One sans family. Hierarchy comes from the optical size axis, so a heading and a
body line are drawn by the same file with different letterforms, which is what
SF Pro Display and SF Pro Text do with two files. The existing `text.*`,
`tracking.*`, `weight.*` and `leading.*` scales are kept as they are.

The mono rule is unchanged and still enforced by convention: commands, versions,
hashes, ratios and counts are mono, sentences are not, and the two never mix
inside one block.

### Shape

| Token | Value | Used for |
| --- | --- | --- |
| `radius.control` | 6px | buttons, fields, small controls |
| `radius.card` | 10px | cards, list surfaces |
| `radius.window` | 14px | windows, sheets, media |
| `radius.full` | 9999px | pills |
| `corner` | `squircle` | every one of the above |

Continuous corners are the signature of this system. They are the curvature Apple
uses on icons, windows and controls, they cost one CSS declaration, they touch no
colour, and a browser without `corner-shape` renders plain rounded corners with
nothing else lost.

Separation is a one pixel hairline, not a shadow. Shadow is reserved for surfaces
that genuinely float: popovers, sheets, dragged items, and the app window.

### Motion, icons, spacing

- Motion: three durations (120ms, 180ms, 260ms), two easings, one
  `prefers-reduced-motion` rule that disables both.
- Icons: Lucide, 1.5px stroke, 20px grid in UI and 16px inline. Documented and
  given size tokens, not bundled as a dependency.
- Spacing, measure: `space.*` and `measure.*` unchanged.

### Responsiveness

Container queries, not viewport breakpoints. A component narrows because its own
box narrowed, so the same card is correct in a narrow sidebar and in a full width
page, and a consumer embedding a component in an unexpected place does not have
to override anything.

Named container widths ship as JS values in `tokens.js` and in the Tailwind
theme. They cannot ship as CSS variables: `@container (max-width: var(--x))` does
not work, the same way media queries cannot read custom properties. The README
has to say this, because trying it is the obvious first move.

Fixed rules across both archetypes: 44px minimum tap target on every control, and
`env(safe-area-inset-*)` on any chrome pinned to a screen edge.

A container query does not raise specificity. `@container (max-width: 640px) {
.nav .links { display: none } }` ties with the plain `.nav .links { display:
flex }`, so whichever is written last wins and a narrow rule declared early
silently never applies. Every container query block ships at the end of the
sheet, after the rules it is meant to beat, and `components.css` is emitted in
that order rather than grouped by component.

The narrow floor is 320px, not 375px. It is where a nav that never wraps gives
up, and it costs nothing to hold.

## The terminal, ten tokens

Every product here prints machine output, so the terminal earns real tokens
rather than one amber phosphor.

| Token | Value | Ratio on ground |
| --- | --- | --- |
| `terminal` | `#1C1C1E` | ground |
| `terminal-foreground` | `#F5F5F7` | 15.63 |
| `terminal-dim` | `#98989D` | 5.93 |
| `terminal-red` | `#FF6B60` | 6.10 |
| `terminal-green` | `#4ED17F` | 8.71 |
| `terminal-yellow` | `#F0B84A` | 9.45 |
| `terminal-blue` | `#409CFF` | 6.01 |
| `terminal-magenta` | `#DA8FFF` | 7.58 |
| `terminal-cyan` | `#5AC8F5` | 8.92 |
| `terminal-selection` | `#34618E` | selection fill |

The ground does not follow the theme. The same palette on a white terminal tops
out at 2.87:1 and every colour fails, so a themed terminal is not one palette
with two grounds, it is two palettes, sixteen tokens and two sets of ratios to
keep true forever. A terminal is a terminal whatever the page around it does,
which is the one argument worth keeping from the CRT this replaces.

Apple's own dark system colours were the starting point and two did not survive:
`systemRed` measures 4.99:1 and `systemPurple` 4.83:1 on this ground, too close
to the floor for output that is often a single word. Both were lifted past 6:1.

## Two archetypes over one core

A marketing page and a catalog page want different things, and one vocabulary
forced on both leaves every page fighting the system. So the core stays single,
and two archetypes sit on top of it. Each may define tokens of
its own. Neither may redefine a core token.

### `marketing`

| Token | Value |
| --- | --- |
| `radius-section` | 30px, stepping down to 20px in a narrow container |
| `gradient-hero` | vertical blue gradient behind the hero |
| `shadow-glossy` | inset white highlights on a near black pill |
| `font-accent` | Instrument Serif italic |

The serif is a third face and the only real indulgence in the system. It appears
on one line per page, loads only when this archetype is used, is a single weight
and style at roughly 22KB, and is licensed OFL 1.1 like everything else here. It
never appears inside an app.

### `catalog`

| Token | Value |
| --- | --- |
| `card-media` | 16 / 10 |
| `shadow-1`, `shadow-2`, `shadow-3` | three step elevation ladder for cards |

Patterns that come with it: a filter chip row that scrolls sideways with scroll
snap rather than wrapping, a segmented control that moves onto its own row in a
narrow container, and a two column shelf that becomes one column.

A test reads the built CSS and fails if an archetype token appears in the core
output, so the two cannot quietly merge.

## Components (closes #23)

The package ships CSS classes rather than React components. forgepod already ships
shadcn/ui, the docs site is Astro, and a React package would be wrong for both.
The package exports `components.css` with `.wl-*` classes, and React consumers
keep their own shadcn components, which are already correct because the role
names match.

Tier 1, needed by both archetypes: button (solid, quiet, plain, sizes sm and md),
icon button, link, card, badge, chip, input, textarea, kbd, list row, separator,
toolbar, nav bar.

Tier 2: segmented control, tabs, accordion, dialog, sheet, popover, dropdown,
tooltip, toast, command palette, table, avatar, skeleton, progress, switch,
checkbox, radio, marquee.

Tier 1 lands first and is releasable on its own.

## Prose (closes #24)

`.wl-prose` moves out of `guide.astro` and into the package: headings,
paragraphs, lists, tables, blockquotes, inline code and code blocks, all under
the mono rule.

## Figma (closes #25)

Built through the Figma MCP from `tokens/`: colour and number variables, text
styles, effect styles, then Tier 1 components. Needs one Figma file to exist
first.

## Tests added

Existing contrast and hue tests stay. New:

1. Neutral chroma ceiling of 0.008.
2. Terminal palette ratios against the fixed ground.
3. Archetype tokens absent from core output.
4. Shipped woff2 count matches the families the tokens name.
5. No docs page has `scrollWidth` greater than `innerWidth`, swept across
   280, 320, 360, 375, 390, 414, 430, 480, 540, 600, 768, 860, 1024 and 1280.
   Checking one width is how the second of the two failures below survived a
   pass at 390. Run it inside an iframe of the target width: headless Chrome
   clamps its window to 500px, so a narrower `--window-size` lays out at 500 and
   crops the image, which hides real failures and invents others. Ignore
   elements whose ancestor scrolls on the x axis, or the filter row and every
   terminal block report as false positives.

The two failures had different causes, which is why the sweep matters more than
any single fix:

- A definite `width` on a grid item. The width sets the track's minimum, and the
  `max-width: 100%` beside it then resolves against the track it just widened.
  Auto width with a `max-width` cap does not have the problem.
- A container query that lost on source order, so a nav kept its links at 320px
  and pushed 33px past the edge.

## Release

0.4.0, breaking. The CHANGELOG carries a mapping table from old names to new.
`weekndlabs.com#17` needs rewriting against the new role names before that
migration is picked up.

Order of work, each step releasable:

1. Core tokens, terminal, fonts, tests, ABOUT and README rewritten, docs site
   restyled to two panels.
2. Archetypes.
3. Tier 1 components, then Tier 2.
4. Prose.
5. Figma.

## Decided against

- Keeping amber. It is the only visual equity WeekndLabs has, and dropping it
  is a real cost. A blue accent was chosen anyway, for a Mac native read.
- Blue as `primary`. It would make blue buttons the default and demote the
  ink pill to a variant.
- A translucent material layer. More macOS than anything else on the table,
  but it adds an axis to both the colour system and the contrast test, and it is
  expensive on the GPU when overused. Revisit after components exist.
- Themed terminal. Sixteen tokens instead of ten, for no gain.
- Viewport breakpoints. Container queries do the same job without breaking
  when a component is embedded somewhere narrow.
- Four themes, or two full themes carrying their own radius and type. Two
  signatures cancel each other out.

## Not decided here

Icon set beyond the recommendation, motion curves in numbers, and what the
component API looks like once a second consumer exists.
