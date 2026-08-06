# @weekndlabs/design

Design tokens for Omni, Bubo, forgepod and weekndlabs.com. Colour, type and
spacing live in one place, and a test refuses any change that drops a text colour
below its WCAG threshold.

The roles are shadcn/ui's, so a component copied from shadcn works here without a
translation table.

Every theme, every role and every measured contrast ratio is on
[design.weekndlabs.com](https://design.weekndlabs.com), rendered from this same
source. This page is also the guide there.

## Install

```bash
npm i @weekndlabs/design
```

`dist/` is committed as well, so a git URL works for anything on `main` that is
not released yet:

```bash
npm i github:weekndlabs/design
```

Tokens change how a page looks, so a bump is worth reading before it ships. At
`0.x` anything that moves a value is a minor. `0.4.0` replaces every colour in
the system, drops the `paper` theme and three of the six typefaces, so read the
migration notes below before taking it.

## Use it with Tailwind v4 and shadcn/ui

One import, and you can delete your own theme block:

```css
@import '@weekndlabs/design/shadcn.css';
```

That file pulls in `tokens.css`, registers every role in `@theme inline` so
`bg-card` and `text-muted-foreground` are real classes, and declares the dark
variant:

```css
@custom-variant dark (&:is([data-theme='dark'] *));
```

shadcn component source only ever writes `dark:` utilities, never `.dark`
itself, so pointing the variant at `data-theme` is shadcn's own customisation
point. Copied shadcn code keeps working, and there is one switch instead of two.

`@theme inline` rather than `@theme` is load-bearing. `inline` keeps the `var()`
reference in the compiled output, which is what lets `data-theme` restyle a built
page with no rebuild.

## Use it in Astro or plain CSS

```css
@import '@weekndlabs/design/tokens.css';
```

Then set the theme on `<html>`:

```html
<html data-theme="dark">
```

`light` and `dark` are the only strings that select a theme. Store the visitor's
choice and set it straight through:

```js
document.documentElement.dataset.theme = localStorage.theme ?? 'dark';
```

Set nothing and you get `dark`, from a `:where(:root)` block that carries no
specificity. It is a fallback so an unconfigured page still renders, and it loses
to your own `:root` whichever order the stylesheets load in. A site whose default
is light keeps its default.

Colours are oklch, so use them directly:

```css
body {
  background: var(--wl-background);
  color: var(--wl-foreground);
  border-color: oklch(from var(--wl-border) l c h / 0.4);
}
```

A variable holding a real colour is what makes derived values work, so a hover
state or a tinted badge needs no token of its own:

```css
.button:hover { background: oklch(from var(--wl-primary) calc(l - 0.06) c h); }
.badge        { background: oklch(from var(--wl-primary) l c h / 0.12); }
```

For a step that has to gain contrast in every theme, mix toward the ink instead
of subtracting lightness. Subtracting is only correct on a light background:

```css
.button:hover { background: color-mix(in oklch, var(--wl-primary) 85%, var(--wl-foreground)); }
```

Everything unthemed is ready as-is: `var(--wl-space-5)`, `var(--wl-text-hero)`,
`var(--wl-font-mono)`.

## Corners

Four steps, and every one of them continuous rather than circular:

```css
.button { border-radius: var(--wl-radius-control); corner-shape: var(--wl-corner-shape); }
.card   { border-radius: var(--wl-radius-card);    corner-shape: var(--wl-corner-shape); }
.window { border-radius: var(--wl-radius-window);  corner-shape: var(--wl-corner-shape); }
.pill   { border-radius: var(--wl-radius-full);    corner-shape: var(--wl-corner-shape); }
```

6, 10, 14 and 9999px, which is what macOS uses for a control, a card, a window
and a pill. `corner-shape` is the signature of this system: it is the curvature
Apple draws icons and windows with, and a browser without it ignores the
declaration and keeps the radius, so it needs no `@supports` guard.

`--wl-radius` still exists and equals `--wl-radius-card`. It is what shadcn reads
and what Tailwind derives its whole `rounded-*` ladder from, and a test ties the
two together so they cannot drift.

## Container widths

`narrow` 640px, `medium` 900px, `wide` 1280px, and they are deliberately not CSS
variables:

```js
import { containers } from '@weekndlabs/design';
```

In Tailwind they arrive through `shadcn.css` as `--container-*`, which is what
makes `@max-narrow:` compile. Writing
`@container (max-width: var(--wl-container-narrow))` by hand does not work: a
container query cannot read a custom property, and it fails by never matching
rather than by erroring.

Container queries also do not raise specificity, so a block of them ties with the
plain rules it is meant to beat and loses on source order. Emit them last.

## Fonts

The package carries the faces its tokens name, so a consumer does not have to
find them and does not hit a font host:

```css
@import '@weekndlabs/design/fonts.css';
```

Three files, latin subset, 113KB in total, and a face is only downloaded if the
page uses it.

Inter is one variable file at 71KB carrying the whole 100 to 900 range and the
optical size axis. That axis is why there is one sans here and not two: the same
file draws a hero and a caption with different letterforms, which is what SF Pro
Display and SF Pro Text do with two separate files. Browsers apply it from the
rendered size on their own, and `fonts.css` sets `font-optical-sizing: auto`
because a reset that turns it off costs the display cut with no error.

JetBrains Mono 400 is the machine voice. Instrument Serif italic is one face for
an editorial line on a marketing page, and never appears inside an app.

The stylesheet also sets Inter's character variants, `cv02 cv03 cv04 cv11`. That
configures the typeface, so it belongs with the typeface.

The face list is derived from `font.*` at build time. A family the tokens name
with no file shipped fails the build rather than falling back to system-ui, and
`dist/fonts/` may hold nothing the tokens do not name, because the build copies
and never deletes.

If your bundler rewrites asset urls, import the stylesheet as a module rather
than with a CSS `@import`. A plain `@import` leaves `url('./fonts/…')` alone and
the woff2 files 404 against wherever the bundled stylesheet ended up.

Every family is under the SIL Open Font License 1.1. Each licence ships in
`dist/fonts/` beside the file it covers, which is what the OFL asks for. The code
stays MIT; the package declares `MIT AND OFL-1.1`.

## Use it with the Tailwind v3 preset

```js
// tailwind.config.js
import preset from '@weekndlabs/design/tailwind';

export default {
  presets: [preset],
};
```

You still need the CSS file for the variables the preset points at:

```css
@import '@weekndlabs/design/tokens.css';
```

Then `bg-background`, `text-foreground`, `border-primary` and `p-5` all resolve
to tokens. There is no `<alpha-value>` slot any more: the variables hold real
colours, so v4 gets opacity from `color-mix` and v3 gets none from the preset.

The preset carries the type scale too, so `font-sans`, `text-hero`,
`tracking-label`, `font-weight-semibold` and `leading-mono` resolve without
adding anything to your config. `rounded-control`, `rounded-card` and
`rounded-window` come with it.

## Guard the type scale

The package ships the gate that keeps the scale from sprawling:

```js
// your test file
import { checkTypography } from '@weekndlabs/design/typography-check';

const found = await checkTypography('src');
assert.deepEqual(found, [], JSON.stringify(found, null, 2));
```

It refuses `text-[13px]` and `text-xs` through `text-xl`, and it walks every
directory including vendored `components/ui`. A vendored component is still a
component on the page.

It refuses them because eleven arbitrary sizes once grew to serve about three
roles: 10px and 11px both meant a label, and 12, 13, 14 and 15 all meant body. A
reader cannot see a 1px difference, so size had stopped carrying meaning. Use the
role, and if none fits, add a role. Opening a twelfth size inside one component
is how the eleven got there.

`text-2xl` and up are still allowed, because the responsive display ramps use
them.

## Use it in JavaScript

```js
import { THEMES, ROLES, TERMINAL, TEXT_ROLES, themes, terminal, containers } from '@weekndlabs/design';

themes.dark.primary;   // 'oklch(0.9707 0.0027 286.35)'
terminal.green;        // 'oklch(0.7685 0.1643 152.62)'
containers.narrow;     // '640px'
```

## The two themes

| Theme | Notes |
|---|---|
| `light` | Neutral ground, ink text, blue at 4.62:1 on the dimmest surface it can sit on |
| `dark` | The fallback, also emitted under `:where(:root)` |

Both fill the same roles. A component names a role, never a colour.

Surfaces and text:

| Role | Meaning |
|---|---|
| `background` / `foreground` | the page and its primary text |
| `card` / `card-foreground` | raised or banded panel |
| `popover` / `popover-foreground` | floating panel |
| `muted` / `muted-foreground` | recessed surface, and secondary text anywhere |
| `secondary` / `secondary-foreground` | quiet control |
| `accent` / `accent-foreground` | the dim hover wash, **not** the brand |
| `sidebar` and its five companions | chrome, a step back from `card` |

Brand and status:

| Role | Meaning |
|---|---|
| `primary` / `primary-foreground` | ink, inverted per theme. A filled pill is the only solid button on a page |
| `destructive`, `success`, `warning` and their foregrounds | status |
| `ring` | focus ring, and the system blue. Also `chart-1` |

Marks:

| Role | Meaning |
|---|---|
| `border` | hairline |
| `input` | emphasised border, used on fields |
| `chart-1` to `chart-5` | categorical series, separated by hue |
| `radius` | corner radius for this theme |

Terminal, which shadcn has no name for. Ten roles, and none of them themed:

| Role | Meaning |
|---|---|
| `terminal-ground` | the surface, equal to the dark theme's `card` |
| `terminal-foreground`, `terminal-dim` | primary and secondary text on it |
| `terminal-red` and five more | the ANSI colours, 25 degrees apart in hue |
| `terminal-selection` | selection fill |

In Tailwind the ground is the default, so `bg-terminal` and `text-terminal-green`
both compile.

The ground does not follow the theme, and that is the point. The same palette
over a white ground tops out at 2.87:1 and every colour in it fails, so a themed
terminal is not one palette with two grounds, it is two palettes and two sets of
ratios to keep true. A terminal is a terminal whatever the page around it does.

**`accent` does not mean the brand.** Under shadcn's vocabulary `--accent` is the
dim hover surface and `--primary` carries the brand. Reach for `primary` where
you used to reach for `accent`.

## The contrast rule

The pairs are not listed anywhere. Every `X-foreground` has to clear its floor on
`X`, and the test derives the list from the role names, so a pair nobody
remembered to add is still tested.

| Pair | Minimum |
|---|---|
| `foreground`, `card-foreground`, `popover-foreground`, `sidebar-foreground` on their surface | 7.0:1 |
| every other `X-foreground` on `X` | 4.5:1 |
| `foreground` on `card`, `muted` and `sidebar` | 7.0:1 |
| `muted-foreground` on `background`, `card`, `muted` and `sidebar` | 4.5:1 |
| `card`, `muted` and `sidebar` against `background` | 1.03:1, so the band is visible at all |

`border`, `input`, `ring` and the five `chart-*` are marks, so they carry no text
threshold and no component may use them as a text colour.

Three rules measure something a ratio cannot see.

`warning` has to sit at least 20 degrees off `primary` in hue. The chart marks
have to sit 25 degrees apart from each other, and so do the six terminal
colours, because output uses them one word at a time. A good categorical palette
often holds lightness steady on purpose, so a luminance test there would reject
the palettes that are correct. That rule caught the terminal cyan at 24.9
degrees from the blue and moved it.

No neutral role may carry chroma above 0.008. Apple's greys sit near 0.004 and
still read as grey; past the ceiling a theme starts leaning toward a colour. The
usual way this fails is a dark theme drifting blue while its light twin stays
neutral, which nobody sees without putting the two side by side.

`npm test` computes every ratio and fails when one drops. When it fails, change
the colour, not the threshold. The blue sits at 4.62:1 on the dimmest surface it
is allowed on, so there is very little room to give away.

`npm run check:overflow` is the other gate, and it needs Chrome, so it is a
script rather than part of `npm test`. It loads each built docs page in an
iframe at fourteen widths from 280 to 1280 and fails on sideways scroll.

## Change a token

```bash
npm run build   # regenerate dist/
npm test        # completeness, format and contrast
git add dist/   # dist is committed, so this is part of the change
```

Edit `tokens/*.json` only. Everything in `dist/` is generated and gets
overwritten.

## Add a theme

Three steps, and none of them is code:

1. add a `color.theme.<name>` block to `tokens/color.semantic.json` filling every
   role
2. add the name to `THEMES` in `lib/tokens.js`
3. `npm run build`

The build maps over `THEMES`, so the `[data-theme='<name>']` block appears on its
own, the Tailwind preset and the JS export follow, and the docs site renders a
fourth panel without an edit. The gate then holds the new theme to every rule
above. Adding a theme is a matter of finding values that pass, for every role.

Fonts and corners do not follow `data-theme`. There is one sans, one mono and
one accent serif, and one radius ladder, so a new theme picks a set of colours
and nothing else.

## Migrating from 0.3.x

Every colour changed. There is no mapping table for values, because none of the
old primitives survive: `sand`, `navy`, `stone`, `amber`, `phosphor` and
`black.crt` are gone, replaced by one neutral ladder and one system blue. Role
names are unchanged, so a component that names roles needs no edit and simply
looks different.

Three things do need an edit:

| 0.3.x | 0.4.0 |
|---|---|
| `data-theme="paper"` | `light` or `dark`. Omni keeps its paper stock in its own stylesheet |
| `--wl-terminal` | `--wl-terminal-ground` |
| `--wl-terminal-foreground-muted` | `--wl-terminal-dim` |
| `--wl-font-ui-body`, `--wl-font-ui-display` | `--wl-font-sans` |
| `--wl-font-ui-mono` | `--wl-font-mono` |
| `--wl-font-paper-*` | gone with the theme |
| `--wl-radius` alone | still there, plus `control`, `card` and `window` |

`primary` is ink now, not the brand amber. If you were using it as a colour
accent rather than as the solid button, you want `ring`.

## Migrating from 0.2.x

This section describes the move to `0.3.0` and still names `paper`, which
`0.4.0` removes. Coming from `0.2.x`, do this one first and then the section
above.

Colours are oklch and hold a real colour, so `rgb(var(--wl-x))` becomes
`var(--wl-x)` and `rgb(var(--wl-x) / 0.4)` becomes
`oklch(from var(--wl-x) l c h / 0.4)`.

Themes: `night-dark` is `dark`, `night-light` is `light`, `receipt` is `paper`.
There is a `dark` alias now, and there deliberately was not one before. The old
objection was that `dark` would mean `night-dark` forever. The real fault was
that `night-dark` mixed a brand name with a mode name in one string; once brand
lives in the roles, `dark` is only a mode. The translation step consumers used to
run at every entry point is gone, not relocated.

Roles:

| 0.2.x | 0.3.0 |
|---|---|
| `surface` | `background` |
| `surface-panel` | `card`, `popover` |
| `surface-sunk` | `muted`, `secondary`, `accent` |
| `ink` | `foreground`, `card-foreground`, `popover-foreground` |
| `ink-soft` | `muted-foreground` |
| `rule` | `border` |
| `rule-strong` | `input` |
| `accent` | `primary`, `ring` |
| `positive` | `success` |
| `negative` | `destructive` |
| `inset` | `terminal` |
| `inset-ink` | `terminal-foreground` |
| `inset-ink-dim` | `terminal-foreground-muted` |
| `rule-soft` | gone, mix `border` toward `background` |
| `accent-strong` | gone, mix `primary` toward `foreground` |

Type roles: `text-display` is `text-hero`, `text-fine` is `text-meta`,
`text-eyebrow` is `text-label`, and `text-display` now means a fixed 2rem. Same
shift for `tracking-*` and `leading-*`. `font-night-*` is `font-ui-*` and
`font-receipt-*` is `font-paper-*`.

Radius: the `sm`, `base`, `md` and `lg` steps are gone, replaced by one themed
`--wl-radius`. `--wl-radius-full` stays, because a pill is 9999px in every theme.

## Local development

```bash
npm install
npm run build       # tokens -> dist/
npm test            # completeness, format, contrast, type scale
npm run check:overflow  # sideways scroll, needs Chrome and a docs build
npm run docs:dev    # the docs site
npm run docs:build
```

## Licence

`MIT AND OFL-1.1`. The code and the tokens are MIT. The font files are not ours
to relicense: Inter, JetBrains Mono and Instrument Serif are under the SIL Open
Font License 1.1, and each licence ships in `dist/fonts/` beside the file it
covers. Keep them together if you redistribute the package further.
