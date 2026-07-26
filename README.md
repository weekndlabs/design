# @weekndlabs/design

Design tokens for Omni, Bubo and weekndlabs.com. Colour, type and spacing live
in one place, and a test refuses any change that drops a text colour below its
WCAG threshold.

## Install

`dist/` is committed, so there is no publish step.

```bash
npm i github:weekndlabs/design
```

## Use it in Astro

```css
@import '@weekndlabs/design/tokens.css';
```

Then set the theme on `<html>`:

```html
<html data-theme="receipt">
```

Colours are RGB channel triplets, so wrap them in `rgb()`:

```css
body {
  background: rgb(var(--wl-surface));
  color: rgb(var(--wl-ink));
  border-color: rgb(var(--wl-rule) / 0.4);
}
```

Everything unthemed is ready to use as-is: `var(--wl-space-5)`,
`var(--wl-radius-lg)`, `var(--wl-text-display)`, `var(--wl-font-night-mono)`.

## Use it in Tailwind

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

Then `bg-surface`, `text-ink`, `border-accent/30` and `p-5` all resolve to
tokens. The alpha modifier works because the preset emits
`rgb(var(--wl-accent) / <alpha-value>)`.

## Use it in JavaScript

```js
import { THEMES, ROLES, themes } from '@weekndlabs/design';

themes['receipt'].accent; // '#7A4E00'
```

## The three themes

| Theme | Product | Notes |
|---|---|---|
| `night-dark` | Bubo, weekndlabs.com | The default, also emitted under `:root` |
| `night-light` | Bubo, weekndlabs.com | Light mode of the same theme |
| `receipt` | Omni | Paper stock, amber ink, light only |

All three fill the same 15 semantic roles. A component names a role, never a
colour.

| Role | Meaning |
|---|---|
| `surface` | page background |
| `surface-panel` | raised or banded background |
| `surface-sunk` | inset background |
| `ink` | primary text |
| `ink-soft` | secondary text |
| `rule` | hairline border |
| `rule-soft` | recessed border |
| `rule-strong` | emphasised border |
| `accent` | the brand amber at whatever value passes on this surface |
| `accent-strong` | hover or emphasis step |
| `inset` | terminal-like sunken surface |
| `inset-ink` | text on `inset` |
| `inset-ink-dim` | secondary text on `inset` |
| `positive` | success |
| `negative` | error |

## Change a token

```bash
npm run build   # regenerate dist/
npm test        # completeness, format and contrast
git add dist/   # dist is committed, so this is part of the change
```

Edit `tokens/*.json` only. Everything in `dist/` is generated and gets
overwritten.

## The contrast rule

Every text role has a floor it has to clear against the surface it sits on:

| Role | On | Minimum |
|---|---|---|
| `ink` | `surface` | 7.0:1 |
| `ink-soft`, `accent`, `accent-strong`, `positive`, `negative` | `surface` | 4.5:1 |
| `inset-ink`, `inset-ink-dim` | `inset` | 4.5:1 |

`rule`, `rule-soft` and `rule-strong` are borders, so they carry no text
threshold and no component may use them as a text colour.

`npm test` computes each ratio and fails when one drops. When it fails, change
the colour rather than the threshold. `night-light accent` sits at 4.80:1, so
there is very little room to give away.

## Local development

```bash
npm install
npm run build       # tokens -> dist/
npm test            # completeness, format, contrast
npm run docs:dev    # the docs site
npm run docs:build
```

## Licence

MIT
