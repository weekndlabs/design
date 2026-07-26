# Why it is built this way

## Three layers instead of a flat palette

A flat palette gives you `--amber` and nothing else. The moment two products
need different ambers, the name stops meaning anything and you get `--amber-2`.

So there are three layers:

```
primitive  →  semantic  →  theme
#F5B841       accent        night-dark.accent = amber.500
```

A primitive is a raw value with no opinion about where it goes. A semantic role
says what a colour is for. A theme decides which primitive fills each role.

The layer that matters is the middle one. A component asks for `accent` and gets
the amber that passes contrast on whatever surface it happens to be sitting on.
Bubo renders `#F5B841` on navy, Omni renders `#7A4E00` on paper, and the
component is unchanged.

## Why Omni keeps its own theme

The easy version of this project makes all three products look the same. Omni's
stylesheet argues against that in its first paragraph:

> The product's whole claim is that it shows you what it removed and lets you get
> it back. So the page is built like a document the tool filed, not a brochure:
> quiet paper, one instrument, itemized numbers.

That paper stock is doing work. Flattening it into the navy the other two use
would cost Omni the thing its page is arguing.

The `receipt` theme is how the system holds both. Omni gets its own values for
every role while sharing the spacing scale, the type scale and the role names.

The one place all three themes agree exactly is the `inset` trio: `#0B0B0C`
ground, `#FFB000` phosphor, `#A87400` dim. A terminal is a terminal regardless
of the page around it, which is what lets Omni keep its CRT without that being an
exception carved out of the system.

## Mono means a machine emitted it

Inherited from Omni, and now a rule of the system:

> Mono type means a machine emitted it. Sans means a person wrote it. Never mix
> the two inside one block.

Commands, versions, tags, measurements and commit subjects are mono. Prose is
sans. The docs site follows its own rule, which is why every token name and
every ratio there is set in JetBrains Mono and every sentence is in Inter.

## Why contrast is a test

The knowledge this system most needed to keep was already written down. It was a
comment in Omni's stylesheet:

```css
/* Dim enough to read as secondary, bright enough to still pass AA (4.8:1).
   The obvious #7A5400 lands at 2.9:1 and fails, so do not darken this. */
--phosphor-dim: #A87400;
```

The comment is correct and well argued, and it still cannot stop anyone from
darkening the value, because a comment has no way to fail.

`lib/tokens.test.js` computes every ratio in every theme and fails when one drops
below its floor. Enforcing the rule no longer requires anyone to read it.

It has already caught something. The first draft of the theme table mapped
`accent-strong` on the light themes to a *lighter* amber, copying Bubo's
`--amber-bright` without noticing that lighter means lower contrast on paper. Six
values failed. On a light theme, the strong step darkens.

Bubo has a live version of the same bug, found while drafting this: `--sage` and
`--clay` are single values used as text in both modes, and in light mode they
measure 1.86:1 and 2.81:1. It belongs in Bubo's own issue, and it is why
`positive` and `negative` are themed here rather than shared.

## Why the docs site has no light/dark toggle

Nearly every design system site has one. A toggle shows one theme at a time,
which makes the other two invisible and turns the argument into a claim you have
to take on faith.

The site puts all three on screen at once instead, rendering the same card in
`night-dark`, `night-light` and `receipt` side by side, with the measured
contrast printed under each one. Reading the three panels against each other is
the only way to check that they really are the same card.
