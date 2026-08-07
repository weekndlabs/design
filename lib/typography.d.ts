// Hand-written, because lib/typography.js is hand-written. Everything in dist/
// is generated and its types are generated beside it.

/** One offence: a file, the line it is on, and the class that is banned. */
export interface TypographyOffence {
  file: string;
  line: number;
  found: string;
}

/**
 * Walks `dir` and returns every banned type-scale class it finds.
 *
 * Refuses arbitrary sizes such as `text-[13px]`, and `text-xs` through
 * `text-xl`, which exist to be replaced by a role. An empty array is a pass.
 */
export declare function checkTypography(dir: string): Promise<TypographyOffence[]>;
