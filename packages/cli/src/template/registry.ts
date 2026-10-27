import type { Block } from "bingo-stratum";
import type { Options } from "./base.js";

type AnyBlock = Block<object | undefined, Options>;

/**
 * The blocks of the template, filled in by `index.ts`. Lives here so the package.json block can
 * look at its siblings without importing them (they import it).
 */
export const registry: {
  /** blocks of each preset, by preset name */
  presets: Record<string, AnyBlock[]>;
  /** every block that `--add-<block>` can add */
  addable: AnyBlock[];
} = { presets: {}, addable: [] };
