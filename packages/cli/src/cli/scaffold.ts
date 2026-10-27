import { runTemplate } from "bingo";
import { intakeDirectory } from "bingo-fs";
import { template } from "../template/index.js";

export interface ApplyTemplateOptions {
  /**
   * `"setup"` for a new project (also creates the starter code), `"transition"` for one that
   * exists: what it contains is kept, only what the template manages is updated.
   */
  mode: "setup" | "transition";
  /** Template ID (`node-library`, `ui-library`, `ui-app`), or `bare` to only add features to any project */
  preset: string;
  /** Project name written into a new `package.json` */
  name: string;
  /** Version of the `@mrmt/*` devDependencies */
  marmotteVersion: string;
  /** Whether to include example source files. @default true */
  includeExamples?: boolean;
  /** IDs of the features to add (`lint`, `format`, ...) */
  features?: string[];
}

/** Writes a template (and the selected features) into `dir`. No network, no install. */
export async function applyTemplate(
  dir: string,
  {
    mode,
    preset,
    name,
    marmotteVersion,
    includeExamples = true,
    features = [],
  }: ApplyTemplateOptions,
) {
  await runTemplate(template, {
    directory: dir,
    mode,
    offline: true,
    // no GitHub repository, no commands: just the files
    skips: { requests: true, scripts: true },
    options: {
      name,
      marmotteVersion,
      includeExamples,
      preset,
      ...Object.fromEntries(features.map((id) => [`add-${id}`, true])),
    } as never, // the `add-*` flags are not part of the options types
    files:
      mode === "transition"
        ? await intakeDirectory(dir, { exclude: /node_modules|^\.git$/ })
        : undefined,
  });
}
