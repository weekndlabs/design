# Why it is built this way

## Three layers instead of a flat palette

A flat palette gives you `--blue` and nothing else. The moment two products need
different blues, the name stops meaning anything and you get `--blue-2`.

So there are three layers:

```
primitive  →  semantic  →  theme
#006CDB       ring          light.ring = blue.light
```

A primitive is a raw value with no opinion about where it goes. A semantic role
says what a colour is for. A theme decides which primitive fills each role.

The layer that matters is the middle one. A component asks for `ring` and gets
the blue that passes contrast on whatever surface it is sitting on. Light renders
`#006CDB`, dark renders `#409CFF`, and the component is unchanged.

## Why the identity is a Mac identity

The system this replaces was assembled from three products that already existed.
It carried three colour families, three themes and six typefaces, and it did not
look like anything in particular. WeekndLabs ships Mac software, so `0.4.0`
picks one thing and commits to it: a neutral ground, one system blue, one sans,
and corners that are continuous rather than circular.

The signature is the corner, not the colour. `corner-shape: squircle` is the
curvature Apple draws icons, windows and controls with, it costs one declaration,
it touches no colour, and a browser without it keeps the plain radius and loses
nothing else. Everything else in the system is quiet on purpose so that one
decision carries.

`primary` is ink rather than blue. A filled pill in the foreground colour is the
only solid button on a page, which is how a Mac app looks, and blue is left to do
what macOS uses it for: focus rings, links, selection, the first chart series. A
consumer arriving from shadcn expects `primary` to hold a brand hue and will get
a black button instead. That is the intent, and it is worth knowing before you
install this.

## The blue is not Apple's blue

Apple's `systemBlue` is `#007AFF`. It fails AA on white at 4.02:1. The blue
apple.com uses, `#0071E3`, passes on white at 4.70:1 and then fails on the muted
surface at 4.31:1, which is where half the links in a UI actually sit.

So the values are `#006CDB` and `#409CFF`, chosen by measuring against every
surface each one is allowed on rather than against the brightest. They read as
system blue. They are not system blue, and the difference is a test.

## Mono means a machine emitted it

Inherited from Omni, and still a rule of the system:

> Mono type means a machine emitted it. Sans means a person wrote it. Never mix
> the two inside one block.

Commands, versions, tags, measurements and commit subjects are mono. Prose is
sans. The docs site follows its own rule, which is why every token name and every
ratio there is set in JetBrains Mono and every sentence is in Inter.

One sans is enough because Inter ships as a variable file carrying an optical
size axis. The same file draws a hero and a caption with different letterforms,
which is the job SF Pro Display and SF Pro Text split across two files. Adding a
display face would buy nothing the axis does not already give.

## Why the terminal keeps its own tokens

Every product here prints machine output, so the terminal is not decoration and
it gets ten roles: a ground, two text weights, six ANSI colours and a selection
fill.

None of them follow the theme, and that is the argument the old system got right
and this one keeps. The same palette over a white ground tops out at 2.87:1 and
every colour in it fails. A themed terminal is therefore not one palette with two
grounds, it is two palettes, sixteen tokens, and two sets of ratios to keep true
forever. A terminal is a terminal whatever the page around it does.

What is gone is the monoculture. The old version reserved one amber phosphor,
which cannot say `warn` and `fail` in the same line.

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

It keeps catching things. On the first draft of the light themes the emphasis
step was mapped to a *lighter* value, which is lower contrast on paper: six
failures. While `0.4.0` was being written, three more.

The hue rules exist because a ratio cannot see what is being asked. Two colours
can share a luminance and still be obviously different, and two more can share a
hue and read as one status. `warning` has to sit 20 degrees off `primary`, the
chart marks 25 degrees apart, and the terminal colours the same, because CLI
output uses them one word at a time. That last rule caught the cyan sitting 24.9
degrees from the blue.

The chroma ceiling is the newest one and the least visible. No neutral role may
carry chroma above 0.008. Apple's greys sit near 0.004 and still read as grey;
past the ceiling a theme starts leaning toward a colour. The usual failure is a
dark theme drifting blue while its light twin stays neutral, and nobody notices
without putting the two side by side, which nobody does.

## Why a token that ships nowhere is worse than a missing one

The terminal roles were added, resolved, and emitted by nothing. They were
colours that were not themed, so the CSS formatter's theme branch skipped them
and its scale branch skipped them too. Every one resolved to nothing in a
browser, and the suite was green, because the gate that walks unthemed tokens
filters colours out by design.

Container widths nearly went the same way for the opposite reason. They must
*not* be CSS variables: `@container (max-width: var(--wl-container-narrow))`
parses, never matches, and reports nothing. So they ship as data and as literals
in the Tailwind bridge, and a test asserts both, plus their absence from the CSS.

Both are the same failure. A token can be defined and still not exist, and only
a test that reads the built output can tell the difference.

## Why the docs site shows both themes at once

Nearly every design system site has a toggle that picks which theme you are
looking at. Showing one at a time makes the other invisible and turns the
argument into a claim you have to take on faith.

The site puts both on screen instead, rendering the same card in `light` and
`dark` side by side, with the measured contrast printed under each. Reading the
two panels against each other is the only way to check that they really are the
same card.

There is a toggle in the navbar, and it does a different job. It changes the
chrome around the pair, never what the pair shows. Themes are scoped by
`[data-theme]` on any element, so each panel carries its own and the root
attribute the toggle flips cannot reach inside them.

The chrome needs to move because the page answers on two hosts. Served at
`weekndlabs.com/design` it is same-origin with the main site and reads the theme
the visitor already chose there, so nobody who picked light lands on a dark page
halfway through the sentence. On `design.weekndlabs.com` there is nothing to read
and the OS preference decides. Either way the two panels stay exactly where they
were.
