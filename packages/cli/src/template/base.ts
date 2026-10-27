import { createBase, type BaseOptionsFor } from "bingo-stratum";
import { z } from "zod";

/** Options shared by every block. `preset` and the `--add-*` / `--exclude-*` flags are added by Stratum. */
export const base = createBase({
  options: {
    name: z.string(),
    /** Version of the `@mrmt/*` devDependencies */
    marmotteVersion: z.string(),
    includeExamples: z.boolean().default(true),
  },
});

export type Options = BaseOptionsFor<typeof base>;

/** How blocks and presets are named in `--add-*` / `--exclude-*` flags and in `--preset` (`Pre-commit` -> `pre-commit`) */
export const idOf = (about?: { name?: string }) => about?.name?.toLowerCase().replace(/\W+/g, "-");
