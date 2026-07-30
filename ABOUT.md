# Why it is built this way

## Three layers instead of a flat palette

A flat palette gives you `--amber` and nothing else. The moment two products
need different ambers, the name stops meaning anything and you get `--amber-2`.

So there are three layers:

```
primitive  →  semantic  →  theme
#F5B841       primary       dark.primary = amber.500
```

A primitive is a raw value with no opinion about where it goes. A semantic role
says what a colour is for. A theme decides which primitive fills each role.

The layer that matters is the middle one. A component asks for `primary` and gets
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

The `paper` theme is how the system holds both. Omni gets its own values for
every role while sharing the spacing scale, the type scale and the role names.

It is named `paper` rather than `receipt` because it names the surface rather than
Omni's product metaphor. If Omni ever stops talking about receipts, the theme is
still accurate.

The one place all three themes agree exactly is the `terminal` trio: `#0B0B0C`
ground, `#FFB000` phosphor, `#A87400` dim. shadcn has no name for it, and it is
kept anyway. A terminal is a terminal regardless
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
the emphasis step on the light themes to a *lighter* amber, copying Bubo's
`--amber-bright` without noticing that lighter means lower contrast on paper. Six
values failed. On a light theme, the strong step darkens.

It caught a second one while `0.3.0` was being written. `warning` was first drawn
from the amber family, ten degrees of hue from `primary`, which would have made
every warning read as a brand accent. Amber is both this system's brand and the
conventional warning colour, and a contrast ratio cannot see that collision at
all, so the rule that catches it measures hue.

Bubo has a live version of the same bug, found while drafting this: `--sage` and
`--clay` are single values used as text in both modes, and in light mode they
measure 1.86:1 and 2.81:1. It belongs in Bubo's own issue, and it is why
`success` and `destructive` are themed here rather than shared.

## Why the docs site shows all three themes at once

Nearly every design system site has a toggle that picks which theme you are
looking at. Showing one at a time makes the other two invisible and turns the
argument into a claim you have to take on faith.

The site puts all three on screen instead, rendering the same card in `light`,
`dark` and `paper` side by side, with the measured
contrast printed under each one. Reading the three panels against each other is
the only way to check that they really are the same card.

There is a toggle in the navbar, and it does a different job. It changes the
chrome around the triptych, never what the triptych shows. Themes are scoped by
`[data-theme]` on any element, so each panel carries its own and the root
attribute the toggle flips cannot reach inside them.

The chrome needs to move because the page answers on two hosts. Served at
`weekndlabs.com/design` it is same-origin with the main site and reads the
theme the visitor already chose there, so nobody who picked light lands on a
dark page halfway through the sentence. On `design.weekndlabs.com` there is
nothing to read and the OS preference decides. Either way the three panels stay
exactly where they were.
