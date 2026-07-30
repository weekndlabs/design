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
`0.x` anything that moves a value is a minor. `0.3.0` renames every role and
every theme and moves colour values to oklch, so read the migration notes below
before taking it.

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
<html data-theme="paper">
```

The three values are `light`, `dark` and `paper`, and they are the only strings
that select a theme. Store the visitor's choice as `dark` or `light` and set it
straight through:

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

Everything unthemed is ready as-is: `var(--wl-space-5)`, `var(--wl-radius-full)`,
`var(--wl-text-hero)`, `var(--wl-font-ui-mono)`. `--wl-radius` is themed, because
corners are part of a theme's character: 10px on `light` and `dark`, 3px on
`paper`.

Weight and line-height are named per face, not as one shared scale, because the
faces do not carry the same weights. Asking Bricolage for 400 gets
you a weight it does not ship. Pair `--wl-weight-mono` and `--wl-leading-mono`
with `--wl-font-ui-mono`, and the display pair with the display face.

## Fonts

The package carries the faces its tokens name, so a consumer does not have to
find them and does not hit a font host:

```css
@import '@weekndlabs/design/fonts.css';
```

Ten files, latin subset, matching the weight tokens. For `ui`: Inter 400, 500 and
600, Bricolage Grotesque 700, JetBrains Mono 400. For `paper`: IBM Plex Sans 400,
500 and 600, IBM Plex Sans Condensed 700, IBM Plex Mono 400. About 215KB in
total, and a face is only downloaded if the page uses it.

The body faces ship at 500 and 600 because shadcn puts `font-medium` and
`font-semibold` on nearly every control. Without them a button silently renders
at 400 and the whole interface reads limp, with no error to explain it.

The stylesheet also sets Inter's character variants, `cv02 cv03 cv04 cv11`. That
configures the typeface, so it belongs with the typeface.

Adding a weight means adding the token first. The face list is derived from
`font.*` and `weight.*` at build time, so a weight nothing declares has no file
and a family with no weight fails the build instead of shipping a gap.

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

The preset carries the type scale too, so `font-ui-body`, `text-hero`,
`tracking-label`, `font-weight-semibold` and `leading-mono` resolve without
adding anything to your config.

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
import { THEMES, ROLES, TEXT_ROLES, themes } from '@weekndlabs/design';

themes['paper'].primary; // 'oklch(0.4624 0.0989 72.22)'
```

## The three themes

| Theme | Product | Notes |
|---|---|---|
| `light` | Bubo, weekndlabs.com, forgepod | Light mode |
| `dark` | Bubo, weekndlabs.com, forgepod | The fallback, also emitted under `:where(:root)` |
| `paper` | Omni | Paper stock, amber ink, light only, 3px corners |

All three fill the same roles. A component names a role, never a colour.

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
| `primary` / `primary-foreground` | the brand amber at whatever value passes here |
| `destructive`, `success`, `warning` and their foregrounds | status |
| `ring` | focus ring, tracks `primary` |

Marks:

| Role | Meaning |
|---|---|
| `border` | hairline |
| `input` | emphasised border, used on fields |
| `chart-1` to `chart-5` | categorical series, separated by hue |
| `radius` | corner radius for this theme |

Terminal, which shadcn has no name for:

| Role | Meaning |
|---|---|
| `terminal` | sunken terminal surface, the same in every theme |
| `terminal-foreground` | phosphor text on it |
| `terminal-foreground-muted` | secondary phosphor |

**`accent` does not mean the brand.** It was the amber before `0.3.0`. Under
shadcn's vocabulary `--accent` is the dim hover surface and `--primary` carries
the brand. Reach for `primary` where you used to reach for `accent`.

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

Two rules measure hue rather than contrast, because a ratio cannot see what is
being asked. `warning` has to sit at least 20 degrees off `primary`, since amber
is both this system's brand and the conventional warning colour. The chart marks
have to sit 25 degrees apart from each other, and a good categorical palette
often holds lightness steady on purpose, so a luminance test there would reject
the palettes that are correct.

`npm test` computes every ratio and fails when one drops. When it fails, change
the colour, not the threshold. `light primary` sits at 4.80:1, so there is very
little room to give away.

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

Fonts do not follow `data-theme`. The families are emitted unthemed, as
`--wl-font-ui-*` and `--wl-font-paper-*`, so a new theme picks one of the
existing groups or brings its own woff2.

## Migrating from 0.2.x

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
npm run docs:dev    # the docs site
npm run docs:build
```

## Licence

`MIT AND OFL-1.1`. The code and the tokens are MIT. The font files are not ours
to relicense: all six families are under the SIL Open Font License 1.1, and each
licence ships in `dist/fonts/` beside the file it covers. Keep them together if
you redistribute the package further.
