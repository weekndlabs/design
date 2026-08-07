import { THEMES, ROLES, TERMINAL } from '../lib/tokens.js';

/**
 * The tokens in W3C Design Tokens format, which Figma Variables and Tokens
 * Studio both import.
 *
 * This exists because the library itself cannot be built from here. The Figma
 * account available to this machine belongs to a different organisation, and a
 * personal project's library does not go in a company's team. So the part that
 * needs no account ships anyway: importing this is a two minute job on whatever
 * account turns out to be the right one, and it stays in step with the code
 * because it is generated from the same source as the CSS.
 *
 * Colours are emitted per mode, which is how Figma models a theme: one
 * collection, two modes, one variable per role. Emitting two collections
 * instead would give a designer two `background` variables and no way to
 * switch between them.
 */
export const formatFigma = ({ dictionary }) => {
  const byName = Object.fromEntries(dictionary.allTokens.map((t) => [t.path.join('.'), t.value]));

  const colour = {};
  for (const role of ROLES) {
    if (role === 'radius') continue; // a length, and it belongs with the others
    colour[role] = {
      $type: 'color',
      $value: byName[`color.theme.${THEMES[0]}.${role}`],
      $extensions: {
        'com.figma': {
          modes: Object.fromEntries(THEMES.map((t) => [t, byName[`color.theme.${t}.${role}`]])),
        },
      },
    };
  }

  const terminal = Object.fromEntries(
    TERMINAL.map((role) => [role, { $type: 'color', $value: byName[`color.terminal.${role}`] }])
  );

  /** Everything unthemed, grouped the way the token files already group it. */
  const group = (prefix, type) =>
    Object.fromEntries(
      dictionary.allTokens
        .filter((t) => t.path[0] === prefix)
        .map((t) => [t.path.slice(1).join('-'), { $type: type, $value: t.value }])
    );

  return `${JSON.stringify(
    {
      $description:
        'WeekndLabs design tokens. Generated from tokens/*.json, do not edit. Colour carries a Figma mode per theme.',
      color: colour,
      terminal,
      space: group('space', 'dimension'),
      radius: group('radius', 'dimension'),
      measure: group('measure', 'dimension'),
      container: group('container', 'dimension'),
      text: group('text', 'dimension'),
      tracking: group('tracking', 'dimension'),
      leading: group('leading', 'number'),
      weight: group('weight', 'number'),
      font: group('font', 'fontFamily'),
      duration: group('duration', 'duration'),
      icon: group('icon', 'dimension'),
    },
    null,
    2
  )}\n`;
};
